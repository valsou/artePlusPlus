// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://www.arte.tv/*
// @run-at       document-body
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

// TODO :
// BUG QUAND ON RESIZE LA FENETRE !!!!!

'use strict';

GM_addStyle(`
.arte-plus-plus ul {
display: flex;
margin-left: 0;
list-style-type: none;
}

.arte-plus-plus li {
background-color: black;
}

.arte-plus-plus li a {
display: inline-block;
color: white;
}`);

const ARTE_API = 'https://api.arte.tv/api/player/v1/config/';
const REGEX = /https:\/\/www.arte.tv\/(fr|de|en|es|pl|it)\/videos\/\d{6}-\d{3}-[A-Z]\//;
const ELEMENT_TO_OBSERVE = document.querySelector('body');
const PARENT_TO_APPEND = '.metas-infos';
const LOCALE = {
    'downloads': {
        'fr_FR': 'Téléchargements',
        'de_DE': 'Downloads',
        'en_EN': 'Downloads',
        'es_ES': 'Descargas',
        'pl_PL': 'Pliki do pobrania',
        'it_IT': 'Download'}
};
let last_page_viewed = "";
// const CODES = {
//     'fr': {
//         'VF': 'Français (Doublé)',
//         'VOF': 'Français (Original)',
//         'VOA-STF': 'Allemand (sous-titré)',
//         'VOA-STMF': 'Allemand (sourds et malentendants)',
//         'VOF-STMA': 'Français (sourds et malentendants)'
//     },
//     'de': {
//         'VA': 'Deutsch (Synchronisiert)',
//         'VOA': 'Deutsch (Original)',
//         'VOA-STA': '',
//         'VOA-STMA': 'Deutsch (Hörgeschädigte)',
//         'VOF-STMA': 'Französisch (Hörgeschädigte)'
//     }
// };

console.log("Arte++ is running...");

(function() {
    console.log("Observing...");
    let nodeElement = ELEMENT_TO_OBSERVE;
    let config = { attributes: true, subtree: true };
    let callback = function(mutationsList) {
        for(var mutation of mutationsList) {
            if (mutation.target.className == 'video-thumbnail') {
                if (last_page_viewed != mutation.target.baseURI) {
                    console.log("Page changed : "+ window.location.pathname);
                    if (mutation.target.baseURI.match(REGEX)) {
                    last_page_viewed = mutation.target.baseURI;
                    getJSON();
                }
            }

        }
    }

    };
 let observer = new MutationObserver(callback);
observer.observe(nodeElement, config);
})();

function getJSON() {
    let location = window.location.pathname.split("/");
    let lang = location[1];
    let video_id = location[3];
    let api_base_url = ARTE_API + lang + "/";
    let api_url = api_base_url + video_id;

    fetch(api_url)
        .then(
        function(response) {
            response.json().then(function(data) {
                getLinks(data);
            });
        }
    );
}

function getLinks(json) {
    let video_data = json.videoJsonPlayer.VSR;
    let video_keys = Object.keys(video_data);
    let parsed_data = [];
    let array_to_return = [];

    video_keys.forEach((key) => {
        let data = video_data[key];

        if (data.mimeType.startsWith("video") === false) {
            return;
        }

        let keep = {
            title: data.versionLibelle,
            code: data.versionCode,
            country_code: data.versionShortLibelle,
            url: data.url,
            width: data.width,
            height: data.height,
            bitrate: data.bitrate,
            extension: data.mediaType
        };

        parsed_data.push(keep);
    });

    array_to_return.videos = parsed_data;

    // add lang of website to show right translations :)
    array_to_return.isoLang = json.videoJsonPlayer.videoIsoLang;

    showLinks(array_to_return);
}

function showLinks(data) {
    let versions = data.videos.sort(sortingByLang);

    let parent = document.querySelector(PARENT_TO_APPEND).parentElement;
    let content = document.createElement("section");
    parent.after(content);

    content.insertAdjacentHTML('beforeend', '<h1><span class="program-title">'+LOCALE.downloads[data.isoLang]+'</span></h1>');

    content.classList.add("program-section", "margin-bottom-s", "arte-plus-plus");

    let old_label = "";

    let ul = document.createElement("ul");
    ul.classList.add("row");

    versions.forEach( function(element) {

        // Subtitle
        let label = element.title;

        if (label != old_label || old_label == "") {
            if (label != old_label && old_label != "") {
                content.appendChild(ul);
                ul = document.createElement("ul");
                ul.classList.add("row");
            }

            let subtitle = document.createElement("h2");
            content.appendChild(subtitle);
            subtitle.insertAdjacentHTML('beforeend', '<span class="program-title small">'+label+'</span>');



            old_label = label;


        }


        ul.insertAdjacentHTML('beforeend', '<li class="columns"><a title="'+element.title+'" href="'+element.url+'">.'+element.extension.toUpperCase()+' ('+element.width+'x'+element.height+')<br />Bitrate : '+element.bitrate+' kbps</a></li>');


    });

    content.appendChild(ul);

}

function sortingByLang (a, b) {
    if (a.code=== b.code) {
        return b.bitrate - a.bitrate;
    }
    return a.code > b.code ? 1 : -1;
}


//         const API_JSON_URL = API_BASE + VIDEO_ID;
//         let onJsonLoadedCb = function(data) {
//                 let allVideoData = data.videoJsonPlayer.VSR;
//                 let keys = Object.keys(allVideoData);
//                 let customDataArray = [];
//                 let content = document.createElement("div");
//                 content.className = "arte-tv-video-downloader";
//                 let header = document.createElement("h2");
//                 let downloadStyle = document.createElement("style");
//                 const targetEl = document.querySelector(".metas-infos");
//                 header.innerHTML = "Download";
//                 downloadStyle.innerHTML = `
// .arte-tv-video-downloader {
// color: #fff;
// overflow: auto;
// }
// .arte-tv-video-downloader ul {
// list-style: none;
// display: block;
// max-width: 100%;
// }
// .arte-tv-video-downloader li {
// display: inline-block;
// padding: 5px;
// border: 1px solid;
// margin: 5px;
// border-radius: 3px;
// }
// .arte-tv-video-downloader a {
// color: #fff;
// text-decoration: none;
// white-space: nowrap;
// }
// .arte-tv-video-downloader a:hover {
// color: #a9dc76;
// text-decoration: none;
// white-space: nowrap;
// }
// .arte-tv-video-downloader li:hover {
// background-color: #000;
// border-color: #a9dc76;
// }
// `;
//                 let list = document.createElement("ul");
//                 keys.forEach((key) => {
//                         let videoData = allVideoData[key];
//                         if (videoData.mimeType.startsWith("video") === false) {
//                                 return;
//                         }
//                         let customData = {
//                                 title: videoData.versionLibelle,
//                                 url: videoData.url,
//                                 width: videoData.width,
//                                 height: videoData.height,
//                                 bitrate: videoData.bitrate
//                         };
//                         customDataArray.push(customData);
//                 });
//                 customDataArray.forEach((v) => {
//                         let el = document.createElement("li");
//                         let anchor = document.createElement("a");
//                         let dim = v.width + "x" + v.height;
//                         anchor.innerHTML = v.title + " (" + dim + ")";
//                         anchor.href = v.url;
//                         anchor.download = true;
//                         anchor.target = "_blank";
//                         el.appendChild(anchor);
//                         list.appendChild(el);
//                 });
//                 content.appendChild(header);
//                 content.appendChild(list);
//                 setTimeout(() => {
//                         targetEl.parentNode.appendChild(downloadStyle);
//                         targetEl.appendChild(content);
//                 }, 3500);
//         };
//         LOG()("Fetching available Videos via API");
//         window.fetch(API_JSON_URL).then((resp) => resp.json())
//                 .catch((ex1) => {LOG("error")("Could not fetch available Videos via API");})
//                 .then(onJsonLoadedCb)
//                 .catch((ex)=>{LOG("error")("Could not parse available Videos");});
// };
