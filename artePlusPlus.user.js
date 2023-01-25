// ==UserScript==
// @name         Arte++
// @version      1.2.2
// @description  Download videos of Arte.tv
// @downloadURL  https://raw.githubusercontent.com/valsou/artePlusPlus/master/artePlusPlus.user.js
// @updateURL    https://raw.githubusercontent.com/valsou/artePlusPlus/master/artePlusPlus.user.js
// @author       Valentin MEZIN
// @match        https://www.arte.tv/*/videos/*
// @run-at       document-body
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

'use strict';

GM_addStyle(`
#arteplusplus {
width: 100%;
font-family: barna,sans-serif;
font-weight: 500;
line-height: 1.4;
background-color: rgb(31,31,31);
color: white;
display: inline-block;
}

#arteplusplus p {
padding: 16px 0;
}

.arteplusplus_link:after {
content: "Copied";
position: absolute;
right: 0;
color: #fff;
}

.arteplusplus_link {
position: relative;
background-color: rgb(70,70,70);
color: rgb(40,40,40);
border: 0;
padding: 4px;
}

.arteplusplus_link.copied {
background-color: rgb(250,72,28);
color: white;
}

#arteplusplus a {
color: white;
text-decoration: underline;
}`);

const ARTE_API = 'https://api.arte.tv/api/player/v2/config/';
const REGEX = /https:\/\/www.arte.tv\/(fr|de|en|es|pl|it)\/videos\/\d{6}-\d{3}-[A-Z]\//;
const LOCATION = window.location.pathname.split("/");
const LANG = LOCATION[1];
const VIDEO_ID = LOCATION[3];
const ELEMENT_TO_OBSERVE = document.querySelector('main').children[1];
const LOCALE = {
    'downloads': {
        'fr': 'Téléchargements',
        'de': 'Downloads',
        'en': 'Downloads',
        'es': 'Descargas',
        'pl': 'Pliki do pobrania',
        'it': 'Download'},
    'copy': {
        'fr': 'Copier',
        'de': 'Kopieren',
        'en': 'Copy',
        'es': 'Copiar',
        'pl': 'Kopiuj',
        'it': 'Copia'},
    'copied': {
        'fr': 'Copié !',
        'de': 'Kopiert !',
        'en': 'Copied !',
        'es': 'Copiado !',
        'pl': 'Skopiowane !',
        'it': 'Copiato !'}
};
const ICON_COPY = '&#x2398';

console.log("Arte++ is running...");

(function() {
    console.log("Observing...");

    getJSON();
})();

function getJSON() {
    let api_base_url = ARTE_API + LANG + "/";
    let api_url = api_base_url + VIDEO_ID;

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
    let video_data = json.data.attributes.streams;
    let video_keys = Object.keys(video_data);
    let array_to_return = [];

    Array.from(video_keys).forEach((key) => {
        let data = video_data[key];

        array_to_return.push({
            url: data.url,
            label: data.versions[0].label
        });
    });

    showLinks(array_to_return);
}


function showLinks(data) {

    ELEMENT_TO_OBSERVE.insertAdjacentHTML('afterend', '<div id="arteplusplus"></div>');
    let div = document.querySelector("#arteplusplus");
    div.setAttribute('class',div.previousSibling.getAttribute('class'));
    div.innerHTML = "<p><b>Copy and paste one of the links below with youtube-dl software.</b>It will download the stream of the audio & the video, then merge both into a .mp4 file. You'll also need ffmpeg to do the merging.<br>";
    div.innerHTML += "Youtube-dl downlopad page: <a href=\"https://github.com/ytdl-org/youtube-dl\">https://github.com/ytdl-org/youtube-dl</a><br>FFmpeg download page: <a href=\"https://ffmpeg.org/download.html\">https://ffmpeg.org/download.html</a><br><br>";
    div.innerHTML += "arte.tv doesn't provide anymore link to a .mp4 file. :)<br><br>";

    data.forEach((key) => {
        div.innerHTML += `<div><b>`+key.label+`</b> : <input style="width:100%;" class="arteplusplus_link" type="text" value="`+encodeURI(key.url)+`"></div>`
    });

    div.innerHTML += "</p>";

    let inputs = document.querySelectorAll('.arteplusplus_link');

    Array.from(inputs).forEach(link => {

        link.addEventListener('click', function(event) {
            GM_setClipboard(link.value, "text")
            link.classList.add("copied");
            let temp = link.value
            link.value = LOCALE.copied[LANG]
            setTimeout(function(timer){
                link.classList.remove("copied");
                link.value = temp
            }, 400)
        });
    });
}
