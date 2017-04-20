var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

const ROOT_URL = 'http://www.mmjpg.com';
const SAVE_DIR = './mmjpg';
var url_query = [ROOT_URL];
var done_query = [];

/**
 * 工具函数 mkdir
 * 用于判断文件家是否存在，不存在则创建
 * @param path 文件夹路径
 * @param dirName 待创建文件夹名称
 */
function mkdir( path, dirName ) {
    fs.access( path + '/' + dirName, fs.constants.F_OK, ( err ) => {
        if ( err ) {
            fs.mkdir( path + '/' + dirName );
            // console.log( path + '/' + dirName + ' is created!');
        } else {
            // console.log( path + '/' + dirName + ' is existed!');
        }
    });
}

/**
 * 工具函数 contains
 * @param arr 数组
 * @param val 待判断的值
 * @returns 包含为true， 不包含为false
 */
function contains( arr, val ) {
    for( var i = 0; i < arr.length; i++ ) {
        if( val === arr[i] ) {
            return true;
        }
    }
    return false;
}

/**
 * 异步获取相册图片
 * @param ImgUrl 相册图片访问路径
 * @param savaPath 图片保存地址
 */
function getImageAsync( ImgUrl, savePath ) {
    return new Promise( function( resolve, reject ) {
        request( { url: ImgUrl, gzip: true }, ( error, response, body ) => {
            if( !error && response.statusCode === 200 ) {
                let $ = cheerio.load( body );
                let src = $( '#content > a > img' ).attr( 'src' );
                // let tmp = src.split( '/' );
                // let fileName = tmp.length > 0 ? tmp[tmp.length - 1] : null;
                let regexp = /\/(\d+\.[a-zA-Z]+)$/g;
                let tmp = regexp.exec( src );
                let fileName = tmp.length === 2 ? tmp[1] : null;
                if( fileName ) {
                    request.head( src, function( err, res, body ) {
                        request( src ).pipe( fs.createWriteStream( savePath + '/' + fileName ) );
                        console.log( '图片'+fileName+'下载成功！' );
                        resolve();
                    });
                }
            }
            reject();
        });
    });
}

/**
 * 获取链接地址附属地址函数
 * @param url 初始路径
 */
var fetchURL = function( url ) {
    return new Promise( function( resolve, reject ) {
        request( { url: url, gzip: true }, ( error, response, body ) => {
            let tmp_query = [];
            if( !error && response.statusCode === 200 ) {
                let $ = cheerio.load( body );
                let $a = $( 'a' );
                $a.each( function() {
                    let href = $( this ).attr( 'href' );
                    if( href && href.indexOf( ROOT_URL ) != -1 && !contains( tmp_query, href ) ) { // 本地队列去重
                        if( !contains( url_query, href ) ) { // 全局队列去重
                            tmp_query.push( href ); // 添加到本地队列
                            url_query.push( href ); // 添加到全局队列
                        }
                    }
                } );
                resolve( tmp_query.length );
            }
            reject( url );
        } );
    } );
}

/**
 * 开始函数
 */
function start() {
    mkdir('.', 'mmjpg');
    
    var d = new Promise( ( resolve, reject ) => {
        resolve();
    } );

    let circle = 0;

    var step = function( def ) {
        def.then( function() {
            return fetchURL( url_query[circle] );
        } ).then( function( value ) {
            circle = circle + 1;
            if( circle % 100 === 0 ) {
                console.log( circle );
            }
            if(circle != url_query.length) {
                step(def);
            } else {
                console.log(url_query.length);
            }
        }).catch( function( error ) {
            console.log( error );
            circle = circle + 1;
            if( circle % 100 === 0 ) {
                console.log( circle );
            }
            if( circle != url_query.length ) {
                url_query.splice(circle - 1, 1);
                circle = circle + 1;
                step( def );
            }
        });

    };

    // step(d);

}

start();

/*function red() {
    console.log('red');
}

function green() {
    console.log('green');
}

function yellow() {
    console.log('yellow');
}

var tic = function( time, cb ) {
    return new Promise( ( resolve, reject ) => {
        setTimeout( function() {
	    cb();
	    resolve();
	}, time );
    } );
};

var d = new Promise( ( resolve, reject ) => {
    resolve();
} );

let circle = 0;

var step = function( def ) {
    def.then( function() {
        return tic( 1000, red );
    } ).then( function() {
        return tic( 1000, green );
    } ).then( function() {
        return tic( 1000, yellow )
    }).then( function() {
        circle = circle + 1;
	if( circle < 2 ) {
	    step(def);
	}
    });

};

step(d);*/