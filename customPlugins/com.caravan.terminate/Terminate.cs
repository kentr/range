using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;

namespace Cordova.Extension.Commands
{
    public class Terminate : BaseCommand
    {
        public void terminate(string options)
        {
            System.Windows.Application.Current.Terminate();
        }
    }
}
