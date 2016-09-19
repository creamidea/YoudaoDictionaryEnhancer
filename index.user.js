// ==UserScript==
// @name         Youdao Dictionary Enhancer
// @namespace    http://tampermonkey.net/
// @homepage     https://github.com/creamidea/YoudaoDictionaryEnhancer
// @version      1.1.8
// @description  Search words in Celerity
// @author       creamidea
// @match        http://*.youdao.com/*
// @require      http://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.js
// @resource     nprogress_css http://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.css
// @resource     etymoline_css http://www.etymonline.com/style.css
// @resource     etymoline_font http://fonts.googleapis.com/css?family=Slabo+27px:400&lang=en
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @connect      www.etymonline.com
// @updateURL    https://openuserjs.org/meta/creamidea/Youdao_Dictionary_Enhancer.meta.js
// ==/UserScript==

// changelog:
// version 1.1 add translation function in etymoline area
// version 1.0 initial release

GM_addStyle(GM_getResourceText("nprogress_css"));
GM_addStyle('body{font-famile:"Hiragino Sans GB",STHeiti,"Microsoft YaHei","Wenquanyi Micro Hei","WenQuanYi Micro Hei Mono","WenQuanYi Zen Hei","WenQuanYi Zen Hei Mono",LiGothicMed}');
GM_addStyle('.youdao-trans-icon {position: absolute;border-radius: 5px;padding: 3px; background-color: rgb(245, 245, 245);box-sizing: content-box;cursor: pointer;height: 18px;width: 18px;z-index: 2147483647;border: 1px solid rgb(220, 220, 220);color: rgb(51, 51, 51);}');
GM_addStyle('.etymoline .hint {text-align: center;font-size: 24px;margin: 24px 0;color: rebeccapurple;}');
GM_addStyle('#container{background: #f6f4ec;border-radius: 6px;box-shadow: 2px 2px 9px 1px gray;padding-left: 16px;padding-right: 16px;padding-bottom: 26px;margin-top: 24px;}');
GM_addStyle('.keyword{font-family: Georgia,"Lucida Grande","Lucida Sans Unicode","Lucida Sans",Geneva,Arial,sans-serif; font-size: 39px;border-bottom: 2px gray dotted;}');
GM_addStyle('#phrsListTab .trans-container>ul{font-size: 16px;} #phrsListTab .trans-container>ul>li{margin: 4px auto;}');
GM_addStyle('li .collinsMajorTrans{background: gainsboro !important;}');

(function () {
    'use strict';
    if (NProgress === undefined)
        NProgress = {
            set: function () { },
            start: function () { },
            inc: function () { },
            done: function () { },
            configure: function () { },
        };
    var ETYMONLINEHTTP = 'http://www.etymonline.com';
    var YOUDAOHTTP = $(location).attr('protocol') + '//' + $(location).attr('hostname');
    var $scontainer = $('#scontainer');
    var $query = $('#query');
    var $topImgAd = $('#topImgAd');
    var $webTrans = $('#webTrans');
    var injectEtymolineName = 'creamidea' + makeId(9); // make the name of injecting function is unique
    var openURLFunName = 'openurl' + makeId(9);
    var proxySelection = 'proxySelection' + makeId(9);
    var sltContainerName = 'selectionContainer' + makeId(9);
    var youdaoSearchButtonId = 'youdaoSearchButton' + makeId(9);

    // window global function. It is the callback in the iframe
    window[injectEtymolineName] = function (event) {
        // open the next page in the etymoline.com iframe
        event.preventDefault();
        var target = event.target;
        request(ETYMONLINEHTTP + target.attributes.href.value);
    };
    window[openURLFunName] = function (event) {
        event.preventDefault();
        location.href = event.target.attributes.href.value;
    };
    window[proxySelection] = function (event) {
        var sel = window.getSelection();
        var range = document.createRange();
        var targetSel = this.getSelection();
        var $sltContainer = $('#' + sltContainerName);
        var selectionText = encodeURIComponent(targetSel.toString());
        var $youdaoSearchButton = $('#' + youdaoSearchButtonId);
        if ($sltContainer.length === 0)
            $sltContainer = $('<div id=' + sltContainerName + ' />').appendTo('body');
        if ($youdaoSearchButton.length === 0)
            $youdaoSearchButton = $('<butotn id=' + youdaoSearchButtonId + ' class="youdao-trans-icon">').append('<a href="javascript: void(0)"><img src="http://shared.ydstatic.com/images/favicon.ico"></a>').appendTo('body');
        if (selectionText === "") {
            $youdaoSearchButton.css({ display: 'none' });
            return;
        }

        $sltContainer.css({ position: "absolute", zIndex: -1, top: "-1000px" }).text(selectionText);
        setTimeout(function () {
            $youdaoSearchButton.find('a').attr('href', YOUDAOHTTP + '/w/' + selectionText + '/')
                .end().css({ left: $('#' + injectEtymolineName).data('click-x'), top: $('#' + injectEtymolineName).data('click-y'), display: 'block' });
        }, 24);

        range.selectNode($sltContainer[0]);
        sel.removeAllRanges();
        sel.addRange(range);
        // range.setStart(targetSel.anchorNode, targetSel.anchorOffset);
        // range.setEnd(targetSel.focusNode, targetSel.focusOffset);
        // sel.removeAllRanges();
        // sel.empty();
        // sel.setBaseAndExtent(targetSel.anchorNode, targetSel.anchorOffset, targetSel.focusNode, targetSel.focusOffset);
        // window.getSelection().anchorNode.textContent.substring(this.getSelection().extentOffset, this.getSelection().anchorOffset);
    };

    // create the frame wrapper
    var $frameWrapper =
        $('<div id=' + injectEtymolineName + '-wrapper class="etymoline"/>').css({ border: 0, width: '100%' }).html(
            '<div class="hint">Etymoline.com ...</div>');
    if ($webTrans.length === 0) return; // maybe no result :)

    $frameWrapper.insertBefore($webTrans);

    // set NProgress
    NProgress.configure({ parent: '#' + injectEtymolineName + '-wrapper' });
    NProgress.set(0.7);
    NProgress.inc(0.2);

    // request the etymoline.com page
    var $phrsListTab = $('#phrsListTab');
    var queryWord;
    if ($phrsListTab.length > 0 && $phrsListTab.find('.keyword').length > 0)
        queryWord = $phrsListTab.find('.keyword').text();
    else
        queryWord = $query.val();
    setTimeout(function () { request(ETYMONLINEHTTP + '/index.php?term=' + encodeURIComponent(queryWord)); }, 0);

    // remove the ad
    $topImgAd.remove();
    $('#baidu-adv').remove();
    $('#follow').remove();
    $('#webTrans .tabs a').each(function (i, link) {
        if (link.innerText === '英英释义')
            link.click();
    });

    // from: http://stackoverflow.com/a/12444641/1925954
    var keys = {};
    function test_key(selkey) {
        var alias = {
            "Ctrl": 17,
            "Shift": 16,
            "/": 191,
            "a": 65,
            "e": 69
        };
        return keys[selkey] || keys[alias[selkey]];
    }
    function test_keys() {
        var i,
            keylist = arguments,
            status = true;
        for (i = 0; i < keylist.length; i++) {
            if (!test_key(keylist[i])) {
                // status = false;
                return false;
            }
        }
        return status;
    }
    function globalKeydown(event) {
        var keyCode = event.keyCode;
        keys[keyCode] = event.type === 'keydown';
        if (test_keys('Shift', 'e')) {
            if ($('.baav .voice-js')[0]) $('.baav .voice-js')[0].click();
            keys = {};
            return false;
        } else if (test_keys('Shift', 'a')) {
            if ($('.baav .voice-js')[1]) $('.baav .voice-js')[1].click();
            keys = {};
            return false;
        } else if (test_keys('Shift', '/')) {
            // ? => help
            toggleHelp();
            keys = {};
            return false;
        } else if (test_keys('/')) {
            $query.focus().select();
            keys = {};
            return false; // to avoid input '/' in inputbox.
        }
    }
    function globalKeyup(event) {
        var keyCode = event.keyCode;
        keys[keyCode] = false;
    }
    $(document).keydown(globalKeydown).keyup(globalKeyup);

    // adjust the youdao css
    // move xxx
    $('#container').css({ width: "1000px" });
    $('#results').css({ width: "680px" });
    $('#ads').css({ width: "320px" });
    var transformToggle = [];
    $('#eTransform .tabs').children().each(function (index, elt) {
        transformToggle.push(elt.innerText);
    });
    $('#transformToggle').children().each(function (index, elt) {
        if (elt.id === 'wordGroup') return;
        var $clone = $(elt).clone();
        $clone.addClass('follow').removeClass('hide').css({ display: 'block' }).prepend('<p class="hd">' + transformToggle[index] + '</p>').next().css({ marginTop: "8px" });
        $clone.appendTo('#ads');
    });//.end().parent().remove();
    $('#doc>.c-topbar-wrapper').css({ height: "81px", top: "-42px" }).find('.c-subtopbar').remove();
    $scontainer.css({ marginTop: "42px" });

    function request(url) {
        NProgress.start();
        var xhr = new GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            // anonymous: true,
            onreadystatechange: onreadystatechange,
        });
    }

    function onreadystatechange(resp) {
        var readyState = resp.readyState;
        if (readyState === 0) {
            // Client has been created. open() not called yet.
        } else if (readyState === 1) {
            // open() has been called.
        } else if (readyState === 2) {
            // send() has been called, and headers and status are available.
        } else if (readyState === 3) {
            // Downloading; responseText holds partial data.
        } else if (readyState === 4) {
            switch (resp.status) {
                case 200:
                    etymolineHandler(resp.responseText);
                    break;
                default:
                    GM_log(['Ger Error: ', '\nState: ', resp.readyState, '\nMessage: ', resp.responseText].join(''));
            }
            NProgress.done();
        }
    }

    function etymolineHandler(responseText) {
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(responseText, 'text/html');
        var $dictionary = doc.querySelector('#dictionary');
        $dictionary.style.border = 0;
        $dictionary.style.marginBottom = 0;
        var $frame = $('#' + injectEtymolineName);
        if ($frame.length === 0) {
            $frame = $('<iframe id="' + injectEtymolineName + '" />').css({ border: 0, width: '100%', maxHeight: '600px' });
            $frameWrapper.append($frame);
            $frameWrapper.find('.hint').remove(); // remove the hint.
            $frame.contents().find("head")
                .append('<style>' + GM_getResourceText("etymoline_css") + '</style>')
                .append('<style>' + GM_getResourceText("etymoline_font") + '</style>')
                .append('<style>' +
                '.etymoline-footer {border: 0px;color: wheat;text-align: right;}' +
                '</style>');
            // $frame.contents().on('selectionchange', function () {debugger});
            $frame.contents()
                .on('selectionchange', parent[proxySelection])
                .on('mousemove', function (event) { $frame.data('click-x', $frame.offset().left + event.pageX); $frame.data('click-y', $frame.offset().top + event.pageY - 30); })
                .on('keydown', function (event) { globalKeydown(event); })
                .on('keyup', function (event) { globalKeyup(event); });
        }
        $frame.contents().find("body")
            .html($dictionary)
            .append('<footer class="etymoline-footer">From: <a href="http://www.etymonline.com/index.php" style="color: wheat;" target="_blank">The Online Etymology Dictionary</a></footer>');
        // Some fix
        $frame.ready(function () {
            $frame.css({ height: $frame.contents().find("html").height() });
            $frame.contents().find("body img").map(function (index, img) {
                // the resource path of dictionary png
                img.src = ETYMONLINEHTTP + '/graphics/dictionary.gif';
                return img;
            });
            $frame.contents().find("body a.dictionary").map(function (index, link) {
                // click the png
                link.target = '_blank';
                return link;
            });
            $frame.contents().find("body #dictionary dl a").not('.dictionary').map(function (index, link) {
                // click the word
                // link.onclick = parent[injectEtymolineName];
                var oLink = new URL(link.href);
                var term = oLink.search.slice(1).split('&').map(function (v) { var _v = v.split('='); return { key: _v[0], value: _v[1] }; }).filter(function (v) { if (v.key === 'term') return v; })[0];
                link.href = YOUDAOHTTP + '/w/' + term.value + '/';
                link.onclick = parent[openURLFunName];
                //link.href = link.href.replace(new RegExp(YOUDAOHTTP), ETYMONLINEHTTP);
                //link.target = '_blank';
                // link.href = 'javascript:void(0);';
                // link.style.cursor = 'default';
                return link;
            });
            $frame.contents().find("body .paging a").map(function (index, link) {
                // The code below is just for fun :P
                // var oLink = new URL(link.href);
                // var p = oLink.search.slice(1).split('&').map(function(v){var _v = v.split('=');return {key: _v[0], value: _v[1]}}).filter(function(v){if(v.key==='p')return v;})[0].value
                link.onclick = parent[injectEtymolineName];
                return link;
            });
        });
    }

    function makeId(len) {
        if (isNaN(parseInt(len))) len = 8;
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    function toggleHelp() {
        console.log('Message for help. Comming soon...');
    }

})();