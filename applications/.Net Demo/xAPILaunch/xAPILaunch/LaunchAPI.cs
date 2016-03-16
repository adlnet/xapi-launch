using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
namespace xAPILaunch
{
    class xAPIActor
    {
        public string mbox;
        public string name;
        public string objectType;
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
        public LaunchData Launch(string launchUrl, string launchToken)
        {
            client = new HttpClient();
            HttpResponseMessage responseMessage = null;
            var _launchData = new LaunchData();
            try
            {
                responseMessage = client.PostAsync(launchUrl + "launch/" +  launchToken, null).Result;
            }
            catch (Exception e)
            {
                _launchData.response = e.Message;
            }
            if (responseMessage != null)
            {
                string responseText = responseMessage.Content.ReadAsStringAsync().Result;
                var status = responseMessage.StatusCode;

                try
                {
                    LaunchData jsonResponse = JsonConvert.DeserializeObject<LaunchData>(responseText);
                    _launchData.Actor = jsonResponse.Actor;
                }catch(Exception e)
                {
                    _launchData.response = responseText;
                }
                return _launchData;
            }else
            {
                return _launchData;
            }
        }
    }
}
