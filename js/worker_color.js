onmessage = function(e){
    var imageData = e.data.data,
        imageData_length = imageData.length,
        colorMaxLength = 5,
        imagePixelCount = imageData_length / 4,
        tmpKey = "",
        colorObj = {},
        colors = {
            main:[],
            sub:[],
            accent:[]
        };

    var isApproximateColor = function(rgb1, rgb2) {
        var col1 = rgb1.split(",");
        var col2 = rgb2.split(",");
        var r = col1[0] - col2[0],
            g = col1[1] - col2[1],
            b = col1[2] - col2[2];
        if( 50 < Math.sqrt(r*r + g*g + b*b) ) return false;
        return true;
    };

    var sortColors = function() {
        var removed;
        colors.main.sort( function( a, b ) { return b.num - a.num; } );
        colors.sub.sort( function( a, b ) { return b.num - a.num; } );
        removed = colors.sub.splice(colorMaxLength, colors.sub.length - colorMaxLength);
        console.log(removed);
        for (var i = 0; i < removed.length; i++) {
            colors.accent.push(removed[i]);
        };
        colors.accent.sort( function( a, b ) { return b.num - a.num; } );
        colors.accent.splice(colorMaxLength, colors.accent.length - colorMaxLength);
    };

    var isExist = false,
        i;

    // ピクセル走査
    for(i=0; i<imageData_length; i+=4) {
        tmpKey += imageData[i] + ',';
        tmpKey += imageData[i + 1] + ',';
        tmpKey += imageData[i + 2];

        for(var key in colorObj){
            if(isApproximateColor(key, tmpKey)) { //近似色チェック
                colorObj[key] = colorObj[key] + 1;
                isExist = true;
                break;
            }
        }
        if(!isExist) {
            colorObj[tmpKey] = 1;
        } else {
            isExist = false;
        }
        tmpKey = "";
    }
 
    // 返すデータ
    for(var key in colorObj) {
        var percent = (colorObj[key] / imagePixelCount * 100);
        if(30 < percent) { // メインカラー
            var type = {name:"main"};
        } else if(5 < percent) { // サブカラー
            var type = {name:"sub"};
        } else if(1 < percent) { // アクセントカラー
            var type = {name:"accent"};
        } else {
            continue;
        }
        colors[type.name].push({name:key, num:colorObj[key]});
    }
    
    sortColors();
 
    postMessage({
        colors:colors
    });
};
 
