using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Waterfall.Models;

namespace Waterfall.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index()
        {
            return View();
        }

        public JsonResult GetPictures() 
        {
            var param = new WaterfallParams();
            TryUpdateModel(param);

            var pictures = LoadData(param);

            return Json(pictures, JsonRequestBehavior.AllowGet);
        }

        private List<Picture> LoadData(WaterfallParams wp)
        {
            var data = new List<Picture>();
            string path = Server.MapPath("~/") + "pictures.json";
            using (StreamReader sr = new StreamReader(path))
            {
                string sData = sr.ReadToEnd();
                sData = sData.Replace("\r\n", "").Replace(" ", "");
                data = JsonConvert.DeserializeObject<List<Picture>>(sData);
            }

            if (!wp.LoadOnce) 
            {
                data = data.Skip(wp.Index).Take(wp.Total).ToList();
            }

            return data;
        }

    }

    public class Picture 
    {
        public string bgColor { get; set; }
    }
}
