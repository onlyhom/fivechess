window.onload=function (){
	
    var chess = new Chess({
    	renderMode: 'dom', //默认选中渲染模式 dom canvas
        isMatchComputer: true, //默认是否选中人机对战
    	undoStep: 3 //默认可悔棋的步数
    });
}