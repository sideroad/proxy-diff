# Confirm contents via proxies

### Usage

```sh
npm i -g proxy-diff
proxy-diff -c ${path_to_config_file}
```

#### Configuration

##### proxies ( Array )
Proxy URLs should be specified.

##### urls ( Array )
Request URLs should be specified.

```json
{
  "proxies": [
    "http://aproxy:8080",
    "http://bproxy:8080"
  ],
  "urls": [
    "http://aaa.bbb.com/aaa.txt",
    "http://aaa.bbb.com/bbb.txt",
    "http://aaa.bbb.com/ccc.txt"
  ]
}
```

#### Options

##### -c --config
Configuration file path

##### -f --format ( default: `colored` )
Specify output format. `colored`, `plain`, `html` can be used.
