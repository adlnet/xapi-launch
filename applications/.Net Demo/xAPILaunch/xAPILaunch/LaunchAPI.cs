using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;

namespace xAPILaunch
{
    class xAPIActor
    {
        public string mBox;
        public string name;
    }
    class LaunchData
    {
        public xAPIActor Actor;
        public int launchCode;
    }
    class LaunchAPI
    {
        public LaunchData Launch(string launchUrl, string launchToken)
        {
              var _launchData = new LaunchData();

                



              return _launchData;
        }
    }
}
