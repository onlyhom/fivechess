function hasClass(dom, classname){
	return dom.classList.contains(classname);
}
function addListClass(domList, classname){
	for(var i=0; i<domList.length; i++){
		domList[i].classList.add(classname);
	}
}
function removeListClass(domList, classname){
	for(var i=0; i<domList.length; i++){
		domList[i].classList.remove(classname);
	}
}
function setOption(defaultOpt, opt){
	return typeof(opt)=='undefined' ? defaultOpt : opt;
}

window.Chess = (function() {
	
	function Chess(config){
		this.chess;
		this.gameArea;
		this.chessboard;
		this.buttonsContain;
		this.buttons = {};
		this.resetBtnArr = [];
		this.dataAI = {};
		this.isPlaying = false;
		this.gridArr = [];
		this.isBlack = true; 
		this.stepHistory = [];
		this.redoArr = [];
		this.chessArr = [];
		this.isWin = false;
		this.context;
		this.canvasContain;
		this.renderMode = setOption('dom', config.renderMode);
		this.isComputer = setOption(true, config.isMatchComputer);
		this.undoStep = setOption(10, config.undoStep);
		this.init();
	}
	Chess.prototype = {
		constructor: Chess,
		init: function(){
			var _this = this;
			_this.drawGameArea();
			_this.chessArr = _this.createDoubleArr('empty');
		},
		createDoubleArr:function(value){
			var _this = this;
			var doubleArr = [];
			for(var i=0; i<15; i++){
				var tempArr = [];
				for(var j=0; j<15; j++){
					tempArr.push(value);
				}
				doubleArr.push(tempArr);
			}
			return doubleArr;
		},
		drawGameArea:function(){
			var _this = this;
			//绘制游戏区域
			_this.gameArea = document.createElement("div");
			_this.gameArea.className = "game-area";

			//绘制棋盘
			_this.chessboard = _this.drawChessboard();

			//绘制按钮和输入框
			_this.buttonsContain = document.createElement("div");
			_this.buttonsContain.className = "buttons-contain";

			_this.buttons.domMode = _this.drawButton('dom模式');
			_this.buttons.canvasMode = _this.drawButton('canvas模式');
			_this.buttons.humanComputer = _this.drawButton('人机对战');
			_this.buttons.humanMatch = _this.drawButton('玩家对战');

			_this.inputArea = document.createElement("div");
			_this.inputArea.classList.add('input-area');
			_this.inputArea.innerHTML = '<div class="text">可悔棋步数：</div>' +
										'<input type="text" class="step-num" value="'+ _this.undoStep +'"/>';
			_this.returnStepInput = _this.inputArea.getElementsByClassName('step-num')[0];
			_this.returnStepText = _this.inputArea.getElementsByClassName('text')[0];
			_this.buttonsContain.appendChild(_this.inputArea);

			_this.buttons.gameStart = _this.drawButton('开始游戏');
			_this.buttons.gameReset = _this.drawButton('重置', 'disable');
			_this.buttons.stepUndo = _this.drawButton('悔棋', 'disable');
			_this.buttons.stepRedo = _this.drawButton('撤销悔棋', 'disable');

			_this.isComputer ? _this.buttons.humanComputer.classList.add('on') : _this.buttons.humanMatch.classList.add('on');
			_this.renderMode == 'dom' ? _this.buttons.domMode.classList.add('on') : _this.buttons.canvasMode.classList.add('on');

			_this.resetBtnArr.push(_this.buttons.gameReset);
			_this.resetBtnArr.push(_this.buttons.stepUndo);
			_this.resetBtnArr.push(_this.buttons.stepRedo);

			_this.buttons.domMode.addEventListener('click',function(event){
				_this.toggleRenderMode(event);
			});
			_this.buttons.canvasMode.addEventListener('click',function(event){
				_this.toggleRenderMode(event);
			});
			_this.buttons.humanComputer.addEventListener('click',function(event){
				_this.toggleGameMode(event);
			});
			_this.buttons.humanMatch.addEventListener('click',function(event){
				_this.toggleGameMode(event);
			});
			_this.buttons.gameStart.addEventListener('click',function(event){
				_this.gameStart(event);
			});
			_this.buttons.gameReset.addEventListener('click',function(event){
				_this.gameReset(event, false);
			});
			_this.buttons.stepUndo.addEventListener('click',function(event){
				_this.stepUndo(event);
			});
			_this.buttons.stepRedo.addEventListener('click',function(event){
				_this.stepRedo(event);
			});

			_this.gameArea.appendChild(_this.buttonsContain);
			document.body.appendChild(_this.gameArea);
		},
		drawChessboard: function(){
			var _this = this;
			var chessboard, chessBG;

			if(_this.renderMode == 'dom'){
				//dom棋盘
				chessboard = document.createElement("div");
				chessboard.className = "chess-contain";
				chessBG = document.createElement("table");
				chessBG.className = 'chess-bg';
				chessBG.innerHTML = ('<tr>'+'<td></td>'.repeat(14)+'</tr>').repeat(14); //利用ES6中的reapet函数
				chessboard.appendChild(chessBG);

				_this.gameArea.appendChild(chessboard);
			}else{
				//canvas棋盘
				_this.canvasContain = document.createElement("div");
				_this.canvasContain.className = "canvas-contain";

				chessBG = document.createElement("canvas");
				chessBG.className = "canvas-bg";
				chessBG.width = 540;
				chessBG.height = 540; 
				_this.context = chessBG.getContext("2d");
				_this.drawCanvasGrid();
				_this.canvasContain.appendChild(chessBG);

				chessboard = document.createElement("canvas");
				chessboard.className = "canvas-board";
				chessboard.width = 540;
				chessboard.height = 540; 
				_this.context = chessboard.getContext("2d");
				_this.canvasContain.appendChild(chessboard);

				_this.gameArea.appendChild(_this.canvasContain);
			}
			
			chessboard.addEventListener('click',function(event){
				_this.playerMoveChess(event);
			});

			return chessboard; 
		},
		drawCanvasGrid:function(){
			var _this = this;
            _this.context.fillStyle = '#ffedcc';  
            _this.context.fillRect(0, 0, 540, 540); 
              //棋盘网格线 
            for (var i = 1; i < 16; i++) {  
                _this.context.beginPath();
                _this.context.lineWidth = 1; 
                _this.context.strokeStyle = '#999'; 
                _this.context.moveTo(36 * i-18, 18);  
                _this.context.lineTo(36 * i-18, 522);  
                _this.context.closePath();  
                _this.context.stroke();  
                _this.context.beginPath();  
                _this.context.moveTo(18, 36 * i - 18);  
                _this.context.lineTo(522, 36 * i - 18);  
                _this.context.closePath();  
                _this.context.stroke();  
            } 
		},
		drawButton:function(text, classname){
			var dom = document.createElement("div");
			dom.className = "button";
			classname ? dom.classList.add(classname) : void 0;
			dom.innerText = text;
			this.buttonsContain.appendChild(dom);
			return dom;
		},
		toggleGameMode:function(event){
			var _this = this;
			if (!event.target.classList.contains('disable') && !_this.isPlaying){
				_this.isComputer = event.target.innerText === '人机对战' ? true : false;
				_this.buttons.humanComputer.classList.toggle('on');
				_this.buttons.humanMatch.classList.toggle('on');
			}
		},
		toggleRenderMode:function(event){
			var _this = this;
			if (!event.target.classList.contains('disable') && !_this.isPlaying){
				if(!event.target.classList.contains('on')){
					_this.buttons.domMode.classList.toggle('on');
					_this.buttons.canvasMode.classList.toggle('on');
					_this.gameReset(event, true, event.target.innerText);
				}
			}
		},
		gameStart: function(){
			var _this = this;
			if(hasClass(_this.buttons.gameStart, 'disable')){
				return false;
			}else{
				if(!_this.isPlaying){
					_this.isPlaying = true;
					_this.buttons.gameStart.classList.add('disable');
					_this.buttons.gameReset.classList.remove('disable');
					
					var tempStep =  parseInt(_this.returnStepInput.value); 
					if(tempStep > 0){
						_this.undoStep = tempStep;
						_this.returnStepInput.value = tempStep;
					}else{
						alert('输入步骤有误 可悔棋步数自动修改为1');
						_this.returnStepInput.value = 1;
					}
					_this.undoStep = _this.returnStepInput.value;
					_this.returnStepInput.readOnly = true;
					_this.returnStepText.classList.add('disable');

					if(_this.renderMode == 'dom'){
						_this.buttons.canvasMode.classList.add('disable');
					}else{
						_this.buttons.domMode.classList.add('disable');
					}
					if(_this.isComputer){
						_this.buttons.humanMatch.classList.add('disable');
						_this.dataAI.isComplete = true;
						_this.dataAI.scoreArr = _this.createDoubleArr(0);
					}else{
						_this.buttons.humanComputer.classList.add('disable');
					}
				}
			}
		},
		gameReset: function(event, isToggle){
			var _this = this;
			if(isToggle){
				if(_this.renderMode == 'dom'){
					_this.gameArea.removeChild(_this.chessboard);
					_this.renderMode = 'canvas';
				}else{
					_this.gameArea.removeChild(_this.canvasContain);
					_this.renderMode = 'dom';
				}
			}else{
				if(_this.renderMode == 'dom'){
					_this.gameArea.removeChild(_this.chessboard);
				}else{
					_this.gameArea.removeChild(_this.canvasContain);
				}
			}

			_this.chessboard = _this.drawChessboard();
			removeListClass(document.getElementsByClassName('button'),'disable');
			removeListClass(document.getElementsByClassName('button'),'on');
			_this.isComputer ? _this.buttons.humanComputer.classList.add('on') : _this.buttons.humanMatch.classList.add('on');
			_this.renderMode == 'dom' ? _this.buttons.domMode.classList.add('on') : _this.buttons.canvasMode.classList.add('on');
			addListClass(_this.resetBtnArr,'disable');
			_this.returnStepInput.readOnly = false;
			_this.returnStepText.classList.remove('disable');

			_this.chessArr = _this.createDoubleArr('empty');
			_this.stepHistory = [];
			_this.redoArr = [];
			_this.isPlaying = false;
			_this.isWin = false;
			_this.isBlack = true;
		},
        setDirectX: function (i, j, chessType) {
        	//下子到i，j X方向 结果: 多少连子 两边是否截断
            var m, n,
                nums = 1,
                sideLeft = false,
                sideRight = false;
            for (m = j - 1; m >= 0; m--) {
                if (this.chessArr[i][m] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[i][m] === 'empty') {
                        sideLeft = true;
                    }
                    break;
                }
            }
            for (m = j + 1; m < 15; m++) {
                if (this.chessArr[i][m] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[i][m] === 'empty') {
                        sideRight = true;
                    }
                    break;
                }
            }
            return { "nums": nums, "sideLeft": sideLeft, "sideRight": sideRight };
        },
        setDirectY: function (i, j, chessType) {
            var m, n,
                count = 1,
                leftEnd = false,
                rightEnd = false;
            for (m = i - 1; m >= 0; m--) {
                if (this.chessArr[m][j] === chessType) {
                    count++;
                }
                else {
                    if (this.chessArr[m][j] === 'empty') leftEnd = true;
                    break;
                }
            }
            for (m = i + 1; m < 15; m++) {
                if (this.chessArr[m][j] === chessType) {
                    count++;
                }
                else {
                    if (this.chessArr[m][j] === 'empty') rightEnd = true;
                    break;
                }
            }
            return { "nums": count, "sideLeft": leftEnd, "sideRight": rightEnd };
        },
        setDirectXY: function (i, j, chessType) {
            var m, n,
                nums = 1,
                sideLeft = false,
                sideRight = false;
            for (m = i - 1, n = j - 1; m >= 0 && n >= 0; m--, n--) {
                if (this.chessArr[m][n] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[m][n] === 'empty') {
                        sideLeft = true;
                    }
                    break;
                }
            }
            for (m = i + 1, n = j + 1; m < 15 && n < 15; m++, n++) {
                if (this.chessArr[m][n] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[m][n] === 'empty') {
                        sideRight = true;
                    }
                    break;
                }
            }
            return { "nums": nums, "sideLeft": sideLeft, "sideRight": sideRight };
        },
        setDirectYX: function (i, j, chessType) {
            var m, n,
                nums = 1,
                sideLeft = false,
                sideRight = false;
            for (m = i - 1, n = j + 1; m >= 0 && n < 15; m--, n++) {
                if (this.chessArr[m][n] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[m][n] === 'empty') {
                        sideLeft = true;
                    }
                    break;
                }
            }
            for (m = i + 1, n = j - 1; m < 15 && n >= 0; m++, n--) {
                if (this.chessArr[m][n] === chessType) {
                    nums++;
                }
                else {
                    if (this.chessArr[m][n] === 'empty') {
                        sideRight = true;
                    }
                    break;
                }
            }
            return { "nums": nums, "sideLeft": sideLeft, "sideRight": sideRight };
        },
        weightStatus: function (nums, sideLeft, sideRight, isAI) {
        	//权重方案   活：两边为空可下子，眠：一边为空
            var weight = 0;
            switch (nums) {
                case 1:
                    if (sideLeft && sideRight) {
                        weight = isAI ? 15 : 10;	//活一
                    }
                    break;
                case 2:
                    if (sideLeft && sideRight) {
                        weight = isAI ? 100 : 50;	//活二
                    }
                    else if (sideLeft || sideRight) {
                        weight = isAI ? 10 : 5;	    //眠二
                    }
                    break;
                case 3:
                    if (sideLeft && sideRight) {
                        weight = isAI ? 500 : 200;	//活三
                    }
                    else if (sideLeft || sideRight) {
                        weight = isAI ? 30 : 20;	//眠三
                    }
                    break;
                case 4:
                    if (sideLeft && sideRight) {
                        weight = isAI ? 5000 : 2000;	//活四
                    }
                    else if (sideLeft || sideRight) {
                        weight = isAI ? 400 : 100;	//眠四
                    }
                    break;
                case 5:
                    weight = isAI ? 100000 : 10000;	//五
                    break;
                default:
                    weight = isAI ? 500000 : 250000;
                    break;
            }
            return weight;
        },
		computeWeight:function(i, j){
            var weight = 14 - (Math.abs(i - 7) + Math.abs(j - 7)), //基于棋盘位置权重
                pointInfo = {}	//某点下子后连子信息
            //x方向
            pointInfo = this.setDirectX(i, j, 'white');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, true);//AI下子权重
            pointInfo = this.setDirectX(i, j, 'black');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, false);//player下子权重
            //y方向
            pointInfo = this.setDirectY(i, j, 'white');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, true);//AI下子权重
            pointInfo = this.setDirectY(i, j, 'black');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, false);//player下子权重
            //左斜方向
            pointInfo = this.setDirectXY(i, j, 'white');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, true);//AI下子权重
            pointInfo = this.setDirectXY(i, j, 'black');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, false);//player下子权重
            //右斜方向
            pointInfo = this.setDirectYX(i, j, 'white');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, true);//AI下子权重
            pointInfo = this.setDirectYX(i, j, 'black');
            weight += this.weightStatus(pointInfo.nums, pointInfo.sideLeft, pointInfo.sideRight, false);//player下子权重
            return weight;
		},
		computerAI:function(){
			var _this = this;
			var length = _this.chessArr.length;
			_this.dataAI.isComplete = false;
			console.log('计算机下棋啦');
			
            var maxX = 0,
                maxY = 0,
                maxWeight = 0,
                i, j, tem;
            for (i = 0; i < length-1; i++) {
                for (j = 0; j < length-1; j++) {
                    if (_this.chessArr[i][j] != 'empty') {
                        continue; //如果这个位置不为空 则不需要再计算它的权重了
                    }
                    tem = _this.computeWeight(i, j);
                    if (tem > maxWeight) {
                        maxWeight = tem; //记录最大权重值
                        maxX = i; //记录最大权重值的位置
                        maxY = j; 
                    }
                }
            }
            _this.drawChess('white', maxX, maxY, false);
		},
		playerMoveChess:function(event){
			var _this = this;
			var x = Math.floor((event.clientX - _this.gameArea.offsetLeft)/36);
			var y = Math.floor((event.clientY - _this.gameArea.offsetTop)/36);

			if(!_this.isPlaying){
				if(_this.isWin){
					alert('此局已结束 请大侠重新来过');
				}else if(!hasClass(_this.buttons.humanComputer,'on') && !hasClass(_this.buttons.humanMatch,'on')){
					alert('请选择一种对战模式');
				}else{
					alert('请点击开始游戏');
				}
				return false;
			}else if(_this.chessArr[x][y] != 'empty'){
				alert('请将棋子下在空白处');
				return false;
			}else if(_this.isComputer && !_this.dataAI.isComplete){
				alert('请等待计算机下棋');
				return false;
			}else if(_this.isComputer && !_this.isBlack){
				alert('此步由白子落棋 请再悔棋一步或撤销悔棋');
				return false;
			}else{
				var chessType = _this.isBlack ?  "black" : "white";
				_this.drawChess(chessType, x, y, false);
				_this.buttons.stepRedo.classList.add('disable');
				_this.redoArr = [];
			}
		},
		drawChess:function(chessType, x, y, isRedo){
			var _this = this;
			if(_this.renderMode == 'dom'){
				//dom模式画棋子
				var tempChess = document.createElement("div");
				if(_this.isComputer && !_this.isBlack){
					//计算机下棋 延迟0.3秒下棋 dom透明渐变
					tempChess.classList.add('chess', chessType, 'animate-to-bottom');
					var originalTop =  
					setTimeout(function(){
						tempChess.classList.remove('animate-to-bottom');
						_this.dataAI.isComplete = true;
					},300);
				}else{
					//玩家下棋
					tempChess.classList.add('chess', chessType);
				}
				tempChess.style.left = (x * 36 - 14) + 'px';
				tempChess.style.top = (y * 36 - 14) + 'px';
				_this.chessboard.appendChild(tempChess);
				//dom的步骤记录要保存句柄
				_this.stepHistory.push({ "x" : x, "y" : y, "handel":tempChess});

			}else{
				//canvas模式画棋子
				var delay = (_this.isComputer && !_this.isBlack) ? 300 : 0;
				//canvas的步骤记录要保存颜色
				_this.stepHistory.push({ "x" : x, "y" : y });
				setTimeout(function(){
					_this.context.fillStyle = chessType; //绘制黑棋  
					_this.context.beginPath();  
					_this.context.arc( 36 * x + 18, 36 * y + 18, 15, 0, Math.PI * 2, true);  
					_this.context.closePath();  
					_this.context.fill();
					_this.dataAI.isComplete = true;
				},delay);
			}

			_this.chessArr[x][y] = chessType;
			
			if (_this.stepHistory.length > _this.undoStep) {
				_this.stepHistory.shift();
			}
			_this.buttons.stepUndo.classList.remove('disable');
			_this.checkWin(x, y, isRedo);
		},
		stepUndo:function(event){
			var _this = this;
			if(!hasClass(_this.buttons.stepUndo, 'disable')){
				var tempStep = _this.stepHistory.pop();
				_this.redoArr.push(tempStep);
				_this.buttons.stepRedo.classList.remove('disable');
				_this.chessArr[tempStep.x][tempStep.y] = 'empty';

				if(_this.renderMode == 'dom'){
					//dom撤销棋子
					_this.chessboard.removeChild(tempStep.handel);
				}else{
					//canvas撤销棋子 分层 重绘 
					_this.context.clearRect(tempStep.x * 36, tempStep.y * 36, 36, 36); 
				}
				
				_this.isBlack = !_this.isBlack;

				if(_this.stepHistory.length <= 0){
					_this.buttons.stepUndo.classList.add('disable');
				}
			}
		},
		stepRedo:function(event){
			var _this = this;
			if(!hasClass(_this.buttons.stepRedo, 'disable')){
				var tempStep = _this.redoArr.pop();
				var chessType = _this.isBlack ?  "black" : "white";
				_this.drawChess(chessType, tempStep.x, tempStep.y, true);
				_this.buttons.stepUndo.classList.add('disable');

				if(_this.redoArr.length <= 0){
					_this.buttons.stepRedo.classList.add('disable');				
					_this.stepHistory = [];
				}
			}
		},
		checkWin:function(x, y, isRedo){
			var _this = this;
			var length = _this.chessArr.length;
			var temp = {
				"col" : 0,
				"row" : 0,
				"crossLTop" : 0,
				"crossLBottom" : 0
			};
			var chessType = _this.isBlack ? 'black' : 'white'; 
			var m, n;
			//左
		    for (m = x; m >= 0; m--) {
		        if (_this.chessArr[m][y] != chessType) {
		            break;
		        }
		        temp.row++;
		    }
		    //右
		    for (m = x + 1; m < length; m++) {
		        if (_this.chessArr[m][y] != chessType) {
		            break;
		        }
		        temp.row++;
		    }
		    //上
		    for (n = y; n >= 0; n--) {
		        if (_this.chessArr[x][n] != chessType) {
		            break;
		        }
		        temp.col++;
		    }
		    //下
		    for (n = y + 1; n < length; n++) {
		        if (_this.chessArr[x][n] != chessType) {
		            break;
		        }
		        temp.col++;
		    }
			//左上
			for (m = x - 1, n = y - 1; m >= 0 && n >= 0; m--, n--) {
				if (_this.chessArr[m][n] != chessType) {
					break;
				}
				temp.crossLTop++;
			}
			//右下
			for (m = x + 1, n = y + 1; m < length && n < length; m++, n++) {
				if (_this.chessArr[m][n] != chessType) {
					break;
				}
				temp.crossLTop++;
			}
			//右上
			for (m = x + 1, n = y - 1; m < length && n >= 0; m++, n--) {
				if (_this.chessArr[m][n] != chessType) {
					break;
				}
				temp.crossLBottom++;
			}
			//左下
			for (m = x - 1, n = y + 1; m >=0 && n < length; m--, n++) {
				if (_this.chessArr[m][n] != chessType) {
					break;
				}
				temp.crossLBottom++;
			}

			if (temp.row>=5 || temp.col>=5 || temp.crossLTop >= 4 || temp.crossLBottom >= 4) {
				_this.gameWin();
				return;
			}else if(_this.isComputer && _this.isBlack && !isRedo){
				_this.isBlack = !_this.isBlack;
				_this.computerAI();
			}else{
				_this.isBlack = !_this.isBlack;
			}
		},
		gameWin:function(){
			var _this = this;
			var str = _this.isBlack ? '黑子' : '白子';
			setTimeout(function(){
				alert(str+'胜利！'+' 游戏结束');
			},350);
			_this.isWin = true;
			_this.isPlaying = false;
			_this.buttons.stepUndo.classList.remove('on');
			_this.buttons.stepRedo.classList.remove('on');
			_this.buttons.stepUndo.classList.add('disable');
			_this.buttons.stepRedo.classList.add('disable');
		}
	}
	return Chess;
})();




