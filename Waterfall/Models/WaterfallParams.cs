using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Waterfall.Models
{
    public class WaterfallParams
    {
        public int Index { get; set; }
        public int Total { get; set; }
        public bool ReqOnce { get; set; }
    }
}