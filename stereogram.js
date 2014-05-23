var ColorGenerator=(function(){

    function _colorGenerator(color1, color2, color3){
	    if(arguments.length<1){
		    this.colors=[0,0,0];
		} else {
	        this.colors=[color1,color2,color3];
		}
	}
	
    _colorGenerator.prototype.getRandomColor=function(){
	     return this.colors[Math.floor(Math.random()*3)];
	 }

	 
	return  _colorGenerator;
})();


var UnbalancedColorGenerator=(function(){

    function _unbalancedColorGenerator(color1, color2, color1Intensity){
	    this.colors=[color1,color2];
		this.color1Intensity = color1Intensity
	}
	
    _unbalancedColorGenerator.prototype.getRandomColor=function(){
	     return (Math.random()<this.color1Intensity)?this.colors[0]:colors[1];
	 }

	 
	return  _unbalancedColorGenerator;
})();

var ImageManipulator=(function(){

    function _imageManipulator(){}
	
    _imageManipulator.resizeDepthMap=function(image,width,height){
	    var newCanvas = document.createElement('CANVAS');
         newCanvas.width = width;
         newCanvas.height = height;
         var newCanvasCtx = newCanvas.getContext('2d');
           newCanvasCtx.drawImage(image,0,0,width,height);
          return newCanvas;		   
	 }
	 
	 _imageManipulator.resizeTexturePattern=function(image,maxSeparation){
	   //  if(image.width < maxSeparation){
		     var newHeight = (image.height * maxSeparation)/image.width;
			  var newCanvas = document.createElement('CANVAS');
              newCanvas.width = maxSeparation;
              newCanvas.height = newHeight;
              var newCanvasCtx = newCanvas.getContext('2d');
              newCanvasCtx.drawImage(image,0,0,maxSeparation,newHeight);
              return newCanvas;
		/* } else {
		     var newCanvas = document.createElement('CANVAS');
              newCanvas.width = image.width;
              newCanvas.height = image.height;
              var newCanvasCtx = newCanvas.getContext('2d');
              newCanvasCtx.drawImage(image,0,0,newCanvas.width,newCanvas.height);
              return newCanvas;
		 }*/
	 }
	 
	 _imageManipulator.generateTextDepthMap=function(text,fontSize,width,height){
	     var textCanvas = document.createElement('CANVAS');
		 textCanvas.width = width; textCanvas.height = height;
		 var textCanvasCtx = textCanvas.getContext('2d');
		 textCanvasCtx.font="bold "+fontSize+"pt Arial";
		 textCanvasCtx.textAlign = 'center';
		

		 textCanvasCtx.fillStyle="#000000";
		 textCanvasCtx.fillRect(0,0,width,height);
		 textCanvasCtx.fillStyle="#888888";
		 textCanvasCtx.fillText(text,width/2,height/2);
		 return textCanvas;
	 }

	 
	return  _imageManipulator;
})();



var StereogramGenerator =(function(){

    function _stereogramGenerator(){}
	
    _stereogramGenerator.generateSIRD=function(depthMap,color1,color2,
	                                           color3,color1Intensity,
											   width,height,observationDistanceInches,
											   eyeSeparationInches,maxDepthInches,
											   minDepthInches,horizontalPPI){
											   
        depthMap = ImageManipulator.resizeDepthMap(depthMap,width,height);
		var depthMapCtx = depthMap.getContext('2d');
		var depthMapData = depthMapCtx.getImageData(0,0,width,height);
        var colors;
        if(color3){
		    colors = new ColorGenerator(color1,color2,color3);
        } else {
		    colors = new UnbalancedColorGenerator(color1,color2,color1Intensity);
        }		
	    var stereogram = document.createElement('CANVAS');
        stereogram.width = width; stereogram.height=height;
		var stereogramCtx = stereogram.getContext('2d');
		stereogramCtx.drawImage(depthMap,0,0);
		var stereogramData = stereogramCtx.getImageData(0,0,stereogram.width,stereogram.height);
		

        var linksL = [];
        var linksR = [];
        var observationDistance = _stereogramGenerator.convertToPixels(observationDistanceInches,horizontalPPI);
        var eyeSeparation = _stereogramGenerator.convertToPixels(eyeSeparationInches,horizontalPPI);
        var maxdepth = 	_stereogramGenerator.getMaxDepth(_stereogramGenerator.convertToPixels(maxDepthInches,horizontalPPI),observationDistance);
        var minDepth =  _stereogramGenerator.getMinDepth( 0.55, maxdepth, observationDistance, _stereogramGenerator.convertToPixels(minDepthInches, horizontalPPI) );
		for(var l=0;l < height; l++){
		    for(var c = 0;c<width;c++){
			    linksL[c]=c;
				linksR[c]=c;
			}
			for(var c=0; c < width; c++){
			    var depth = _stereogramGenerator.obtainDepth(depthMapData.data[c*4+l*width*4+1],maxdepth,minDepth); 
				var separation = _stereogramGenerator.getSeparation(observationDistance,eyeSeparation,depth);
				var left = c - Math.floor(separation/2);
				var right = Math.floor(left + separation);
				if(left >=0 && right < width ){
				    var visible = true;
					if(linksL[right] != right){
					    if(linksL[right] < left){
						    linksR[linksL[right]] = linksL[right];
							linksL[right] = right;
						} else {
						    visible = false;
						}
					}
					if(linksR[left] != left){
					    if(linksR[left] > right){
						    linksL[linksR[left]] = linksR[left];
							linksR[left] = left;
						} else {
						    visible = false;
						}
					}
					if(visible){
					    linksL[right] = left;
						linksR[left] = right;
					}
				}
			}
			for(var c=0;c < width; c++){
			    var idx = c*4+stereogram.width*4*l;
			    if(linksL[c] == c){
				     var randomColor = colors.getRandomColor();
				     stereogramData.data[idx] = randomColor[0];
					 stereogramData.data[idx+1] = randomColor[1];
					 stereogramData.data[idx+2] = randomColor[2];
					 
 				} else {
				     var idx2 = linksL[c]*4+l*stereogram.width*4;
				     stereogramData.data[idx] = stereogramData.data[idx2];
					 stereogramData.data[idx+1] = stereogramData.data[idx2+1];
					 stereogramData.data[idx+2] = stereogramData.data[idx2+2];
					 stereogramData.data[idx+3] = stereogramData.data[idx2+3];
					 console.log(""+l+","+c);
				}
			}
		}

		stereogramCtx.putImageData(stereogramData,0,0);
		return stereogram;
		
	 }
	 
	 _stereogramGenerator.getMinDepth=function(separationFactor, maxdepth, observationDistance, suppliedMinDepth){
	     var computedMinDepth = Math.floor( (separationFactor * maxdepth * observationDistance) /(((1 - separationFactor) * maxdepth) + observationDistance));
		 return Math.min( Math.max( computedMinDepth, suppliedMinDepth), maxdepth);    
	 }
	 
	 _stereogramGenerator.getMaxDepth=function(suppliedMaxDepth, observationDistance){
	     return Math.max( Math.min( suppliedMaxDepth, observationDistance), 0);
	 }

	_stereogramGenerator.convertToPixels=function(valueInches,ppi){
	     return Math.floor(valueInches * ppi);
	}
	
	_stereogramGenerator.obtainDepth=function(depth, maxDepth, minDepth){
	     return maxDepth - (depth * (maxDepth - minDepth) / 255);
	}
	
	_stereogramGenerator.getSeparation=function(observationDistance,eyeSeparation,depth){
	     return (eyeSeparation * depth) / (depth + observationDistance);
	}
	
	_stereogramGenerator.generateTexturedSIRD=function( depthMap, texturePattern,
			width, height,
			observationDistanceInches, eyeSeparationInches,
			maxDepthInches, minDepthInches,
			horizontalPPI, verticalPPI){
	      depthMap = ImageManipulator.resizeDepthMap(depthMap,width,height);
		  var depthMapCtx = depthMap.getContext('2d');
		  var depthMapData = depthMapCtx.getImageData(0,0,width,height);
          var stereogram = document.createElement('CANVAS');
          stereogram.width = width; stereogram.height=height;
		  var stereogramCtx = stereogram.getContext('2d');

		  var stereogramData = stereogramCtx.getImageData(0,0,stereogram.width,stereogram.height);
		    var linksL = [];
        var linksR = [];
        var observationDistance = _stereogramGenerator.convertToPixels(observationDistanceInches,horizontalPPI);
        var eyeSeparation = _stereogramGenerator.convertToPixels(eyeSeparationInches,horizontalPPI);
        var maxDepth = 	_stereogramGenerator.getMaxDepth(_stereogramGenerator.convertToPixels(maxDepthInches,horizontalPPI),observationDistance);
        var minDepth =  _stereogramGenerator.getMinDepth( 0.55, maxDepth, observationDistance, _stereogramGenerator.convertToPixels(minDepthInches, horizontalPPI) );
		
		var verticalShift = Math.floor(verticalPPI /16);
		var maxSeparation = Math.floor(_stereogramGenerator.getSeparation(observationDistance, eyeSeparation, maxDepth));
		
		texturePattern = ImageManipulator.resizeTexturePattern( texturePattern, maxSeparation );
		var texturePatternData = texturePattern.getContext('2d').getImageData(0,0,texturePattern.width,texturePattern.height);
		stereogramCtx.drawImage(texturePattern,0,0);
		
		for ( var l = 0; l < height; l++ ) {
			for ( var c = 0; c < width; c++ ) {
				linksL[c] = c;
				linksR[c] = c;
			}
			
			for ( var c = 0; c < width; c++ ) {
				var depth = Math.floor(_stereogramGenerator.obtainDepth( depthMapData.data[c*4+4*l*depthMap.width], maxDepth, minDepth ));
				var separation = Math.floor(_stereogramGenerator.getSeparation(observationDistance, eyeSeparation, depth))
				var left = Math.floor(c - (separation / 2));
				var right = Math.floor(left + separation);
				
				if ( left >= 0 && right < width ) {
					var visible = true;
					
					if ( linksL[right] != right) {
						if ( linksL[right] < left) {
							linksR[linksL[right]] = linksL[right];
							linksL[right] = right;
						}
						else {
							visible = false;
						}
					}
					if ( linksR[left] != left) {
						if ( linksR[left] > right) {
							linksL[linksR[left]] = linksR[left];
							linksR[left] = left;
						}
						else {
							visible = false;
						}
					}
					
					if ( visible ) {
						linksL[right] = left;
						linksR[left] = right;
					}					
				}
			}
			
			var lastLinked = -10;
			for (var c = 0; c < width; c++) {
			    var idx = 4*c + 4*l*width;
				if ( linksL[c] == c ) {
					if (lastLinked == c - 1) {
						stereogramData.data[idx] = stereogramData.data[idx-4];
						stereogramData.data[idx+1] = stereogramData.data[idx-4+1];
						stereogramData.data[idx+2] = stereogramData.data[idx-4+2];
						stereogramData.data[idx+3] = stereogramData.data[idx-4+3];
					}
					else {
					    var textureIdx = (c % maxSeparation)*4 + (Math.floor(l + ((c / maxSeparation) * verticalShift)) % texturePattern.height)*texturePattern.width*4;
						stereogramData.data[idx] = texturePatternData.data[textureIdx];
						stereogramData.data[idx+1] = texturePatternData.data[textureIdx+1];
						stereogramData.data[idx+2] = texturePatternData.data[textureIdx+2];
						stereogramData.data[idx+3] = texturePatternData.data[textureIdx+3];;
					}
				}
				else {
				    var idx2 = linksL[c]*4 + 4*l*width;
						stereogramData.data[idx] = stereogramData.data[idx2];
						stereogramData.data[idx+1] = stereogramData.data[idx2+1];
						stereogramData.data[idx+2] = stereogramData.data[idx2+2];
						stereogramData.data[idx+3] = stereogramData.data[idx2+3];

					lastLinked = c;
				}
			}
		}
		
		stereogramCtx.putImageData(stereogramData,0,0);
		return stereogram;
	}
	 
	return  _stereogramGenerator;
})(); 


