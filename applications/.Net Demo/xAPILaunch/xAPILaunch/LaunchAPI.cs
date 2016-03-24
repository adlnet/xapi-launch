using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Web;
namespace xAPILaunch
{
    public class xAPIActor
    {
        public string mbox;
        public string name;
        public string objectType;
        public xAPIActor(string a)
        {
            name = a;
            objectType = "Agent";
            mbox = "";
        }
    }
    public class xAPIVerb
    {
        public string id;
        public xAPIVerb(string verb)
        {
            this.id = verb;
        }
    }
    public class xAPIObject
    {
        public string id;
        public string objectType;
        public xAPIObject(string uri)
        {
            this.id = uri;
            this.objectType = "Activity";
        }
    }
    public class xAPIScore
    {
        public int raw;
        public int min;
        public int max;
        public xAPIScore(int val,int min = 0, int max = 100 )
        {
            this.raw = val;
            this.min = min;
            this.max = max;
        }
    }
    public class xAPIResult
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public xAPIScore score;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public Boolean success;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public Boolean completion;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string response;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public object extensions;
    }
    public class xAPIStatement
    {
        public xAPIActor actor;
        public xAPIVerb verb;
        public xAPIObject _object;
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public xAPIResult result;
        public xAPIStatement(xAPIActor a, xAPIVerb v, xAPIObject o)
        {
            this.actor = a;
            this._object = o;
            this.verb = v;
        }
        public xAPIStatement(string a, string v, string o)
        {
            this.actor = new xAPIActor( a);
            this._object = new xAPIObject(o);
            this.verb = new xAPIVerb(v);
        }
        public string toString()
        {
            var str = JsonConvert.SerializeObject(this);
            str = str.Replace("\"_object\"", "\"object\"");
            return str;
        }
    }
    class LaunchData
    {
        public xAPIActor Actor;
        public int launchCode;
        public HttpStatusCode status;
        public string response;
        public string endpoint;
        public object contextActivities;
    }
    class LaunchAPI
    {
        private HttpClient client;
        private Cookie cookie;
        public LaunchData launchData;
        public string launchUrl;
        public string launchToken;
        public LaunchData Launch(string launchUrl, string launchToken)
        {
            this.launchToken = launchToken;
            this.launchUrl = launchUrl;
            client = new HttpClient();
            HttpResponseMessage responseMessage = null;
            var _launchData = new LaunchData();
            try
            {
                responseMessage = client.PostAsync(launchUrl + "launch/" + launchToken, null).Result;
            }
            catch (Exception e)
            {
                _launchData.response = e.Message;
            }
            if (responseMessage != null)
            {
                string responseText = responseMessage.Content.ReadAsStringAsync().Result;
                var status = responseMessage.StatusCode;
                string cookies = responseMessage.Headers.GetValues("set-cookie").ElementAt(0);
                var cookieParser = new System.Net.CookieContainer();
                cookieParser.SetCookies(new Uri(launchUrl), cookies);
                CookieCollection parsedCookies = cookieParser.GetCookies(new Uri(launchUrl));
                this.cookie = parsedCookies["connect.sid"];
                try
                {
                    LaunchData jsonResponse = JsonConvert.DeserializeObject<LaunchData>(responseText);
                    _launchData = jsonResponse;
                }
                catch (Exception e)
                {
                    _launchData.response = responseText;
                }
                this.launchData = _launchData;
                return _launchData;
            }
            else
            {
                this.launchData = _launchData;
                return _launchData;
            }
        }
        public void terminate()
        {
            client.PostAsync(launchUrl + "launch/" + launchToken +"/terminate", null);
        }
        public void postInitialize(string _object)
        {
            var statement = new xAPIStatement(null, "http://adlnet.gov/expapi/verbs/launched", launchUrl + "launch/" + launchToken);
            statement.actor = this.launchData.Actor;
            postStatement(statement);
        }
        public void postStatement(xAPIStatement statement)
        {
            var body = statement.toString();
            var content = new System.Net.Http.StringContent(body, Encoding.UTF8, "application/json");
            content.Headers.Add("cookie", this.cookie.ToString());
            content.Headers.Add("X-Experience-API-Version", "1.0");
            try
            {
                var responseMessage = client.PostAsync(this.launchData.endpoint + "statements", content).Result;
                string responseText = responseMessage.Content.ReadAsStringAsync().Result;
            }
            catch (Exception e)
            {
                var s = e.Message;
            }
        }
        public void postStatement(string _verb, string _object, xAPIResult result)
        {
            var statement = new xAPIStatement(null, _verb, _object);
            statement.result = result;
            statement.actor = this.launchData.Actor;
            postStatement(statement);
        }
    }
}
