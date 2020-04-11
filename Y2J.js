/*ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ

  Y2J ver1.0
  Y2J converts Yaml to Json

  Licensed under GNU General Public License v2.0

  Copyright 2020- Ruby Fumizuki
  https://rubyfmzk.com
  https://github.com/rubyfmzk/Y2J
  rubyfmzk@gmail.com

   ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ*/

var Y2J = function(ymlFile){
  'use strict';
  var timeStarted = new Date();
  var yml = readFile(ymlFile);
      yml = cleanText(yml);

  var divideYml = yml.split('\n---\n');
  if(divideYml.length == 1){
    var ymlArray = divideYml[0].split('\n');
    var i = -1;
    var indents = [];
    var anchors = {};
    var isEnd = false;
    return createYml(null);
  }
  else{
    var res = [];
    for(var y = 0; y < divideYml.length; y++){
      var ymlArray = divideYml[y].split('\n');
      var i = -1;
      var indents = [];
      var anchors = {};
      var isEnd = false;

      res.push(createYml(null));
    }
    return res;
  }

  function createYml(option){
    var type = getLineType(ymlArray[i+1]);
    var currentRes = getArray(type);
    indents.unshift(getIndent(ymlArray[i+1]));

    while(true){
      i++;
      if(i >= ymlArray.length){
        indents.shift();
        return currentRes;
      }

      var line = ymlArray[i];
      var nextLine = ymlArray[i+1] ? ymlArray[i+1] : "";

      if(type == 'merge') currentRes = putMerge(line, currentRes);
      if(type == 'array') currentRes = putArray(line, currentRes);
      if(type == 'hash') currentRes = putHash(line, currentRes, nextLine);
      if(type == 'string') currentRes = putString(line, currentRes, option);

      if(getIndent(nextLine) < indents[0]){
        indents.shift();
        return currentRes;
      }
    }
  }

  function readFile(filename){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, false);
    xhr.send();
    return xhr.responseText;
  }

  function cleanText(text){
    return text.replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n')
      .replace(/\n[\.]{3}(.|\n)*$/, '')//only Y2J
      // - a: aaa    -
      //   b: bbb ->   a: aaa
      //               b: bbb
      .replace(/(\s*)(\-\s)(\w[^\s]*\:)/g, '$1-\n$1  $3')
      .replace(/\n\s*#[^\n]*\n/g, '\n')//comment in line
      .replace(/\s#[^\n]*\n/g, '\n')//comment after value in line
      .replace(/(^|\n)\s*\n/g, '\n')
      .replace(/(^|\n)\s*$/g, '');
  }

  function getIndent(line){
    if(!line) line = '';
    return line.match(/^\s+/) ? line.match(/^\s+/)[0].length : 0;
  }

  function getLineType(line){
    if(!line) return 'string';
    var type = '';
    if(line.match(/^\s*\<\<\:\s/)) return 'merge';
    if(line.match(/^\s*\-(\s|$)/)) return 'array';
    if(line.match(/^\s*[^\:]+\:(\s|$)/)) return 'hash';
    return 'string';
  }

  function getArray(type){
    if(type == 'array') return [];
    if(type == 'hash') return {};
    if(type == 'string') return '';
  }

  function putArray(line, currentRes){
    var val = getVal(line, 'array');
    var alias = getAlias(line);
    var option = getOptionOfString(line);
    var isMerge = isMergeObject(line);
    val = alias ? alias : val;

    if(isMerge){
      currentRes = putMerge(line, currentRes);
    }
    else if(val){
      setAnchorInline(line, 'array');
      currentRes.push(adjustValType(val));
    }
    else{
      if(alias){
         currentRes.push(alias);
      }
      else{
        var child = createYml(option);
        setAnchorObject(line, child);
        currentRes.push(child);
      }
    }
    return currentRes;
  }

  function putHash(line, currentRes, nextLine){
    var key = line.match(/^\s*([^\:]+)\:/)[1];
    var val = getVal(line, 'hash');
    var alias = getAlias(line);
    var option = getOptionOfString(line);
    var isMerge = isMergeObject(line);
    val = alias ? alias : val;

    if(isMerge){
      currentRes = putMerge(line, currentRes);
    }
    else if(val){
      setAnchorInline(line, 'hash');
      currentRes[key] = adjustValType(val);
    }
    else if(alias){
         currentRes[key] = alias;
    }
    else if(getIndent(line) >= getIndent(nextLine)){
        currentRes[key] = null;
    }
    else{
      var child = createYml(option);
      setAnchorObject(line, child);
      currentRes[key] = child;
    }
    return currentRes;
  }

  function putString(line, currentRes, option){
    var val = line.replace(/^\s+/, '');
    var newLineChar = ' ';
    if(option && option.match(/\|/)) newLineChar = '\n';
    //last
    if(getIndent(ymlArray[i]) > getIndent(ymlArray[i+1])){
      newLineChar = '\n';
      if(option && option.match(/(\|\-|\>\-)/)) newLineChar = '';
    }
    return currentRes += val + newLineChar;
  }

  function putMerge(line, currentRes){
    var key = line.match(/\*([^\s]+)/)[1];
    var val = anchors[key] ? anchors[key] : null;
    if(!val) return currentRes;

    if(isArray(val)){
      if(!isArray(currentRes)) currentRes = [];
      currentRes.push(adjustValType(val));
    }
    else{
      if(typeof currentRes != 'object' || isArray(currentRes)) currentRes = {};
      for(var key in val){
        currentRes[key] = val[key];
      }
    }
    return currentRes;
  }

  function adjustValType(val){
    if(typeof val == 'object') return val;
    if(val.match(/^(0x)?\-?\d+(,?\d{3})*(\.\d+)?$/)) return Number(val);
    if(val.match(/^\d{4}\-\d{2}\-\d{2}([\sT]\d{2}\:\d{2}\:\d{2})?/)) return new Date(val);
    if(val.match(/^\[.*\]$/) || val.match(/^\{.*\}$/)) return eval("(" + val + ")");
    if(val == 'true' || val == 'yes' || val == 'on') return true;
    if(val == 'false' || val == 'no' || val == 'off') return false;
    if(val == 'null' || val == '~' || val == '') return null;
    return String(val);
  }

  function setAnchorInline(line, type){
    if(!line.match(/&[^\s]+\s?/)) return;
    var anchor = line.match(/&([^\s]+)/)[1];
    var val = getVal(line, type);
    anchors[anchor] = val;
    return;
  }

  function setAnchorObject(line, object){
    if(!line.match(/\s*&[^\s]+/)) return;
    var anchor = line.match(/\s*&([^\s]+)/)[1];
    anchors[anchor] = object;
    return;
  }

  function getVal(line, type){
    if(type == 'array') line = line.replace(/^\s*\-\s?/, '');
    if(type == 'hash') line = line.replace(/^\s*[^\:\s]+\:\s?/, '');
    return line.replace(/^[\|\>][\-\+]?/, '') // | |- >+ etc
                .replace(/^&[^\s]+\s?/, '') // &anchor
                .replace(/^\*[^\s]+/, '') // *alias
                .replace(/^\<\<\:\s\*[^\s]+\s*/, '')
                .replace(/^\"(.*)\"$/, '$1'); // <<: *alias
  }

  function getAlias(line){
    if(!line.match(/\s\*[^\s]+/)) return null;
    var alias = line.match(/\s\*([^\s]+)/)[1];
    return anchors[alias] ? anchors[alias] : null;
  }

  function isMergeObject(line){
    return line.match(/\<\<\:\s\*/) ? true : false;
  }

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function getOptionOfString(line){
    return line.match(/\s([\|\>][\-\+]?)/) ? line.match(/\s([\|\>][\-\+]?)/)[1] : null;
  }
};