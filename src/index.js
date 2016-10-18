import request from 'superagent';
import fs from 'fs-extra';
import {diffLines} from 'diff';
import colors from 'colors';
import less from 'less';
require('superagent-proxy')(request);

/*
 * {
 *   proxies: [ 'aproxy:8080', 'bproxy:8080' ],
 *   urls: [ 'http://aaa.bbb.com/aaa.txt', 'http://aaa.bbb.com/bbb.txt' ],
 *   format: 'colored' // colored, plain, html
 * }
 */

export default (path, _format) => {
  const settings = fs.readJsonSync(path);
  const format = _format || 'colored';
  const style = fs.readFileSync(require('path').join(__dirname, 'style.less'), 'utf8');
  less
    .render(style, {compress: true})
    .then(
      output => {
        if ( format === 'html' ) {
          console.log('<!DOCTYPE><html><head><style>' + output.css + '</style></head><body>');
        }

        if ( settings.proxies.length !== 2 ) {
          console.log('proxies array should have two proxy');
        }

        const fetches = settings.urls.map(url =>{
          const promises = [];

          settings.proxies.map(proxy =>{
            const promise = new Promise((resolve, reject) => {
              const str = `#fetching ${url} via ${proxy}`;
              switch (format) {
                case 'html':
                  console.log(`<p class='fetching'>${str}</p>`);
                  break;
                default:
                  console.log(str);
              }
              request
                .get(url)
                .proxy(proxy)
                .buffer()
                .end((err, res) => {
                  if ( err ) {
                    reject({
                      err,
                      proxy,
                      url
                    });
                  } else {
                    resolve(res.text);
                  }
                });
            });
            promises.push(promise);
          });
          return Promise.all(promises).then(values => {
            const res = diffLines(values[0], values[1]);
            res.map(line => {
              const prefix = line.added ? '+' :
                             line.removed ? '-' : '';
              if ( prefix ) {
                line.value.split(/[\r\n]+/).map(_str => {
                  const str = `${prefix} ${_str}`;
                  switch (format) {
                    case 'plain':
                      console.log(str);
                      break;
                    case 'html':
                      console.log(`<p class='${prefix === '+' ? 'added' : 'removed'}'>${str}</p>`);
                      break;
                    default:
                      console.log(prefix === '+' ? colors.green(str) : colors.red(str));
                  }
                });
              }
            });
            const hasDiff = res.filter(line => line.added || line.removed).length;
            if ( !hasDiff ) {
              const nodiff = `# No diff in ${url}`;
              switch (format) {
                case 'plain':
                  console.log(nodiff);
                  break;
                case 'html':
                  console.log(`<p class='nodiff'>${nodiff}</p>`);
                  break;
                default:
                  console.log(colors.blue(nodiff));
              }
            }
          }, err => {
            const mes = `# Not found ${err.url} via ${err.proxy}`;
            switch (format) {
              case 'plain':
                console.log(mes);
                break;
              case 'html':
                console.log(`<p class='notfound'>${mes}</p>`);
                break;
              default:
                console.log(colors.yellow(mes));
            }
          }).catch(err => {
            console.log(err);
          });

        });
        Promise.all(fetches).then(
          () => {
            if ( format === 'html' ) {
              console.log('</body></html>');
            }
          }
        );
      }
    );

};
