require 'webrick'
require 'json'
require 'net/http'
require 'net/https' if RUBY_VERSION < '1.9'
require 'uri'
require 'yaml'
require 'pp'

# Load configuration file (default: config.yml).
# For custom path/filename, use this env: 'CONFIG_FILE'
CONFIG_FILE = ENV["CONFIG_FILE"] || "config.yml"
_configuration = YAML::load_file(CONFIG_FILE)

PORT = _configuration["port"] || 3000

class Server < WEBrick::HTTPServlet::AbstractServlet
  def do_POST (request, response)
      web_hook_data = JSON.parse(request.body)

      if web_hook_data["type"] == "app_version"
        circleci_exec(web_hook_data["app_version"]["build_url"])
      elsif web_hook_data["type"] == "ping"
        puts "Ping request received"
      else
        puts "Unknown WebHook response"
      end
  end

  def circleci_exec (app_url)
    # Variables for CircleCI project interaction
    token = _configuration["circleci_token"]
    vcs = _configuration["vcs_type"] || "github"
    org = _configuration["org"]
    repo = _configuration["repo"]
    branch = _configuration["branch"] || "master"

    body = {
        :build_parameters => {
            :CIRCLE_JOB => 'build',
            :APP_URL => app_url
        }
    }

    headers = {
        'Content-Type' => 'application/json'
    }

    url = URI.parse("https://circleci.com/api/v1.1/project/#{vcs}/#{org}/#{repo}/tree/#{branch}?circle-token=#{token}")
    req = Net::HTTP.new(url.host, url.port)
    req.use_ssl = true
    res = req.post(url, body.to_json, headers)
    puts res.body
  end
end

server = WEBrick::HTTPServer.new(:Port => PORT.to_i)
server.mount "/", Server

trap 'INT' do
  server.shutdown
end

server.start