(function($) {

  var $bgcPrimary;
  var $colorFormat;
  var $dropView;
  var $dragZone;
  var $resultView;
  var $resultColorsContainer;
  var $loadingView;
  var $colors;
  var $mainColors, $subColors, $accentColors;
  var $colorsBar;
  var $hiddenFileBtn;
  var $visibleFileBtn;
  var startTime;
  var colorFormat;

  var init = function() {
    create();
    setEvent();
  }

  var create = function() {
    $bgcPrimary = $('.bgc-primary');
    $colorFormat = $('#color-format');
    $dropView = $('#drop-view');
    $dragZone = $('#drag-zone');
    $resultView = $('#result-view');
    $resultColorsContainer = $('#result-colors-container');
    $loadingView = $('.loading-view');
    $colorsBar = $('#colors-bar');
    $colors = $('.colors');
    $mainColors = $('#main-colors');
    $subColors = $('#sub-colors');
    $accentColors = $('#accent-colors');
    $hiddenFileBtn = $('input[type="file"]');
    $visibleFileBtn = $('#btn-select-file');
  }

  var setEvent = function() {
    // 画像のD&D
    $dragZone.on('drop', function(e){
      var files;
      var innerFlag = false;
      e.preventDefault();
      files = e.originalEvent.dataTransfer.files;
      uploadFiles(files);

      $(this).removeClass("over");
      $dropView.hide(0);
      $resultView.hide(0);
      $resultView.fadeIn(600);

      if( !$dropView.hasClass("modal-drop") ) {
        $dropView
          .addClass("modal-drop")
          .removeClass("row");
        $("#main-content")
          .on('dragenter', function() {
            innerFlag = true;
          })
          .on('dragover', function(){
            innerFlag = false;
            $dropView.show(0);
            return false;
          })
          .on('dragleave', function(){
            if (innerFlag) {
              innerFlag = false;
            } else {
              $dropView.hide(0);
            }
            return false;
          });
      }
    }).on('dragover', function(){
      $(this).addClass("over");
      return false;
    }).on('dragleave', function(){
      $(this).removeClass("over");
      if( $dropView.hasClass("modal-drop") ) {
        $dropView.hide(0);
      }
      return false;
    });

    $visibleFileBtn.on("click", function() {
      $hiddenFileBtn.trigger("click");
    });
   
    $hiddenFileBtn.on("change", function(){
      uploadFiles(this.files);
    });

    $(document).on('click', '.pickable', function() {
      var color = $(this).attr("title");
      toastr.success(getColorStringByName(color), "COPIED!!");
    });
    $colorFormat.on('change', function() {
      colorFormat = $(this).val();
    }).trigger('change');
  }
   
  // アップロード処理
  var uploadFiles = function(files) {
    var src;

    if (files.length < 1) {
      alert("ファイルがありません");
      return;
    }
    if (1 < files.length) {
      alert("ファイルは一つでお願いします");
      return;
    }

    $loadingView.show(0);
    $resultColorsContainer.hide(0);

    // ブラウザの差異を吸収
    window.URL = window.URL || window.webkitURL;

    // Blob URLの作成
    src = window.URL.createObjectURL( files[0] );
    document.getElementById( "selected-pic" ).innerHTML = '<img src="' + src + '">' ;

    var canvas = document.getElementById('hidden-canvas'),
        context = canvas.getContext('2d');
 
    var image = new Image();
    image.src = src;
 
    image.onload = function() {
      var worker = new Worker('js/worker_color.js');
      var imageData;

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);
      
      worker.onmessage = function(e){
        console.log((Date.now() - startTime) + " ms");
        console.log(e.data.colors);
        $loadingView.slideUp(300);
        $resultColorsContainer.slideDown(0);
        showPalette(e.data.colors);
        showColorsBar(e.data.colors);

        worker.terminate();
        return false;
      };
      
      startTime = Date.now();
      var imageData = context.getImageData(0,0,canvas.width,canvas.height);
      worker.postMessage(imageData, [imageData.data.buffer]);
    };
  }

  var showPalette = function(colorObj) {
    var tmpColor;
    var getTagWithAry = function(ary) {
      var tmpTag = "<ul>";
      for(var key in ary) {
        var color = ary[key];
        tmpTag += '<li style="background-color:' + getHexValStringByName(color.name) + '" title="' + color.name + '" class="pickable"></li>';
      }
      tmpTag += '</ul>';
      return tmpTag;
    };

    $mainColors.html( getTagWithAry(colorObj.main) );
    $subColors.html( getTagWithAry(colorObj.sub) );
    $accentColors.html( getTagWithAry(colorObj.accent) );

    // 見た目に反映
    if (colorObj.main[0]) {
      tmpColor = colorObj.main[0].name;
    } else if (colorObj.sub[0]) {
      tmpColor = colorObj.sub[0].name;
    } else {
      tmpColor = colorObj.accent[0].name;
    }
    $bgcPrimary.css({
      "background-color": getHexValStringByName(tmpColor),
      "color": getHexValStringByName(color.getContrastGreyScaleColor(tmpColor))
    });
  };

  var showColorsBar = function(colorObj) {
    var tag = "";
    var totalNum = 0;
    var getTagWithAry = function(ary) {
      var tmpTag = "";
      for(var key in ary) {
        var color = ary[key];
        tmpTag += '<span style="background-color:' + getHexValStringByName(color.name) + ';width:' + (color.num / totalNum * 100) + '%;" title="' + color.name + '" class="pickable"></span>';
      }
      return tmpTag;
    };
    var getTotalNum = function(obj) {
      var ret = 0;
      var tmpAry;
      for(var key in obj) {
        tmpAry = obj[key];
        for (var i = 0; i < tmpAry.length; i++) {
          ret += tmpAry[i].num;
        };
      }
      return ret;
    };

    totalNum = getTotalNum(colorObj);

    tag += getTagWithAry(colorObj.main);
    tag += getTagWithAry(colorObj.sub);
    tag += getTagWithAry(colorObj.accent);

    $colorsBar.html(tag);
    $colorsBar.addClass("open");
    $colors.addClass("open");

    var clip = new ZeroClipboard( $('.pickable') );
    clip.on("beforecopy", function(event) {
      var color = event.target.getAttribute("title");
      console.log(color);
      event.target.setAttribute("data-clipboard-text", getColorStringByName(color));
    });
  };

  var getColorStringByName = function(name) {
    switch (colorFormat){
      case 'hex':
      return getHexValStringByName(name);
      case 'rgb':
      return getRgbValStringByName(name);
      case 'rgba':
      return getRgbValStringByName(name, '1.0');
      default:
      return null;
    }
  }

  var getHexValStringByName = function(name) {
    return "#" + name.match(/\d+/g).map(function(a){return ("0" + parseInt(a).toString(16)).slice(-2)}).join("");
  }

  var getRgbValStringByName = function(name, _alpha) {
    if(_alpha) {
      return 'rgba(' + name + ',' + _alpha + ')';
    }
    return 'rgb(' + name + ')';
  };

  var color = {};

  color.getContrastGreyScaleColor = function(colorStr) {
    var rgbAry = colorStr.split(",");
    if( (parseInt(rgbAry[0]) + parseInt(rgbAry[1]) + parseInt(rgbAry[2])) < (255 / 1.8 * 3) ) {
      return "255,255,255";
    } else {
      return "60,60,60";
    }
  };

  $(function(){
    init();
  });

  toastr.options = {
    "closeButton": false,
    "debug": false,
    "progressBar": false,
    "positionClass": "toast-top-right",
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "1600",
    "extendedTimeOut": "800",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }

})(jQuery);