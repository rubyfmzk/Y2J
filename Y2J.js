/*ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ

  Y2J ver1.1
  Y2J converts Yaml to Json

  Licensed under GNU General Public License v2.0

  Copyright 2020- Ruby Fumizuki
  https://rubyfmzk.com
  https://github.com/rubyfmzk/Y2J
  rubyfmzk@gmail.com

   ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ ﾟ･*:.｡..｡.:*･ﾟ*/

var Y2J = function(ymlFile){
  'use strict';
  var startTime = new Date();
  var yml = readFile(ymlFile);
      yml = cleanText(yml);
      yml = yml.split('\n');
  var i = -1;

  var json = createYml();
  var time = new Date().getTime() - startTime;
  console.log('mili seconds：' + time);
  return json;

  function createYml(){
    var type = getLineType(yml[i+1]);
    var group = type.match("array") ? [] : {};

    while(true){
      i ++;
      if(i >= yml.length) return group;

      var line = yml[i];
      var lineType = getLineType(line);
      var key = getKey(line);
      var indent = getIndent(line);

      switch(lineType){
        case 'array':
        case 'hash':
          group = add(group, createYml(), key);
          break;
        case 'array_string':
        case 'hash_string':
          group = add(group, getVal(line), key);
          break;
      }

      //次は上の階層
      if(indent > getIndent(yml[i+1])){
        return group;
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

  function add(group, val, key) {
    if(group instanceof Array) group.push(val);
    else group[key] = val;

    return group;
  }

  function getIndent(line){
    if(!line) line = '';
    return line.match(/^\s+/) ? line.match(/^\s+/)[0].length : 0;
  }

  function getLineType(line){
    if(!line) return 'string';
    var type = '';
    if(line.match(/^\s*\-\s+[^\s]+/)) return 'array_string';
    if(line.match(/^\s*[^\:]+\:\s+[^\s]+/)) return 'hash_string';
    if(line.match(/^\s*\-\s*$/)) return 'array';
    if(line.match(/^\s*[^\:]+\:\s*$/)) return 'hash';
    return 'string';
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

  function getVal(line){
    line = line.replace(/^\s*\-\s?/, '');
    line = line.replace(/^\s*[^\:\s]+\:\s?/, '');
    return adjustValType(line);
  }

  function getKey(line){
    return line && line.match(/^\s*([^\:]+)\:/) ? line.match(/^\s*([^\:]+)\:/)[1] : null;
  }
};