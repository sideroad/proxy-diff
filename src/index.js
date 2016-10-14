import request from 'superagent';
import fs from 'fs-extra';
import {diffLines} from 'diff';
require('superagent-proxy')(request);
const args = process.argv.slice(2);

/*
 * {
 *   proxies: [ 'aproxy:8080', 'bproxy:8080' ],
 *   urls: [ 'http://aaa.bbb.com/aaa.txt', 'http://aaa.bbb.com/bbb.txt' ]
 * }
 */

const settings = fs.readJsonSync(args[0], {throws: false});

if ( settings.proxies.length !== 2 ) {
  console.log('proxies array should have two proxy');
}

settings.urls.map(url =>{
  const promises = [];

  settings.proxies.map(proxy =>{
    const promise = new Promise((resolve, reject) => {
      console.log(`#fetching ${url} via ${proxy}`);
      request
        .get(url)
        .proxy(proxy)
        .end((err, res) => {
          if ( err ) {
            reject(err);
          } else {
            resolve(res.text);
          }
        });
    });
    promises.push(promise);
  });
  Promise.all(promises).then(values => {
    const res = diffLines(values[0], values[1]);
    res.map(line => {
      const prefix = line.added ? '+' :
                     line.removed ? '-' : '';
      if ( prefix ) {
        line.value.split(/[\r\n]+/).map(str => {
          console.log(`${prefix} ${str}`);
        });
      }
    });
    const hasDiff = res.filter(line => line.added || line.removed).length;
    if ( !hasDiff ) {
      console.log(`# No diff in ${url}`);
    }
  }, err => {
    console.log(err);
  }).catch(err => {
    console.log(err);
  });

});
