const {Component, Fragment} = React;

function newArray(size, fill){
	let f = fill === undefined ? (_ => null) : (typeof fill) !== "function" ? (_ => fill) : fill;
	return new Array(size).fill(null).map((_,i) => f(i));
}

class PuzzleContainer extends Component {
	state={
		size: {x: 0, y: 0},
		bulbs: new Array(0).fill(0).map(i => ~~(Math.random() * 2)),
		moves: null,
	}

	static solveSpeed = 500;
	
	mounted=false;
	componentDidMount = ()=>{this.mounted=true}
	
	solved=false;

	solving=false;

	get w(){return this.state.size.x}
	get h(){return this.state.size.y}
	get totalCells(){
		return this.w * this.h;
	}

	static solve = function(target, moves) {
		let size = target.length;
		let matrix = newArray(size, i =>
			[...newArray(size, j => moves[j][i]), 1 - target[i]]
		);
		function addRows(matrix, i1, i2, v) {
			matrix[i2] = newArray(size + 1, i =>
				(v * matrix[i1][i] + matrix[i2][i]) & 1
			)
		}
		function compare(a, b) {
			for (let i = 0; i < size; i++) {
				if (a[i] == 1) return -1;
				if (b[i] == 1) return 1;
			}
			return 0;
		}
		for (let i = 0; i + 1 < size; i++) {
			matrix.sort(compare);
			for (let j = i + 1; j < size; j++){
				addRows(matrix, i, j, matrix[j][i]);
			}
		}
		for (let i = size - 1; i >= 0; i--) {
			for (let j = 0; j < i; j++){
				addRows(matrix, i, j, matrix[j][i]);
			}
		}
		return matrix.map(i => i[size]);
	}

	solvePuzzle(){
		if(this.solving) return;
		let solution = 
			PuzzleContainer.solve(this.state.bulbs, this.state.moves)
			.map((s,i)=>s?i:-1)
			.filter(i=>i!=-1)
			.reverse()
		;
		
		this.solved = this.solving = true;

		let timer = setInterval(_=>{
			if(!solution.length || !this.solving){
				this.solving = false;
				clearInterval(timer)
				return;
			}
			this.toggleBulb(solution.pop());
		}, PuzzleContainer.solveSpeed);
	}
	
	setSize = (w, h) => {
		let newState = {
			size: {x:w, y:h},
			bulbs: newArray(w * h, 0)
		};

		let callback = _=>{
			this.generateMoves();
			this.generateRandom();
		}
		
		if(this.mounted){
			this.setState(newState, callback);
		}
		else{
			this.state = newState;
			callback.apply(this);
		}
	}

	constructor(){
		super(...arguments);
		this.setSize(3, 3);

		window.puzzleContainer = this;
	}
	
	flatten(x, y){return x + y * this.w}
	boundsCheck(x, y){return x < 0 || x >= this.w || y < 0 || y >= this.h}
	arrGet = (x, y, arr) => {return this.boundsCheck(x, y) ? null : arr[this.flatten(x, y)]}
	arrSet = (x, y, arr, value) => {if(!this.boundsCheck(x, y)) arr[this.flatten(x, y)] = value}

	applyMove = (i, arr) => {
		return newArray(arr.length, j => (arr[j] + this.state.moves[i][j]) & 1);
	}

	generateRandom(){
		let {x:w, y:h} = this.state.size;

		let bulbs = newArray(w * h, 0);
		for(let i = 0; i < w * h; i++){
			if(Math.random() > 0.5){
				bulbs = this.applyMove(i, bulbs);
			}
		}
		
		let newState = {
			size: this.state.size,
			bulbs: bulbs//newArray(w * h, _ => ~~(Math.random() * 2))
		};
		if(this.mounted){
			this.setState(newState, this.generateMoves);
		}
		else{
			this.state = newState;
			this.generateMoves();
		}

		this.solved = this.solving = false;
	}
	
	generateMoves = _ => {
		this.state.moves = newArray(this.totalSize, null);
		for(let x = 0; x < this.w; x++){
			for(let y = 0; y < this.h; y++){
				let a = newArray(this.totalCells, 0);
				for(let xx = x - 1; xx <= x + 1; xx++){
					for(let yy = y - 1; yy <= y + 1; yy++){
						this.arrSet(xx, yy, a, 1);
					}
				}
				this.arrSet(x, y, this.state.moves, a)
			}
		}
	}
	
	render(){
		return <Fragment>
			<PuzzleBody parent={this}/>
			<PuzzleControls parent={this}/>
		</Fragment>
	}

	toggleBulb = i => {
		this.setState({bulbs: this.applyMove(i, this.state.bulbs)}, _=>{
			if(this.state.bulbs.every(i=>!!i) && !this.solved){
				this.solved = true;
				setTimeout(_=>{
					alert("You solved the puzzle!");
				}, 200);
			}
		});
	}

	getBulb = i => {
		return this.state.bulbs[i];
	}
}

class PuzzleControls extends Component{
	allowedSizes = [
		[3, 3],
		[3, 4],
		[4, 4],
		[5, 5],
		[3, 6],
		[6, 6],
		[8, 8],
		[9, 9],
		[10, 10],
		[3, 12],
		[12, 12],
	];

	onSelectInput = e=>{
		let [w, h] = e.target.value.split(" ").map(i=>+i);
		let parent = this.props.parent;
		let {x:pw, y:ph} = parent.state.size;
		if(w != pw || h != ph)
			parent.setSize(w, h);
	}

	generateRandom = _=>{
		this.props.parent.generateRandom();
	}

	giveUp = _=>{
		this.props.parent.solvePuzzle();
	}
	
	render(){
		return <div className="puzzle-controls">
			<div className="puzzle-controls-form">
				<button onClick={this.generateRandom}>Randomize</button>
				<button onClick={this.giveUp}>Auto Solve</button>
				<select onInput={this.onSelectInput} onClick={this.onSelectInput}>
					{this.allowedSizes.map(([w,h]) => 
						<option key={`${w} ${h}`} value={`${w} ${h}`}>{w} x {h}</option>
					)}
				</select>
			</div>
		</div>
	}
}

class PuzzleBody extends Component {
	toggleCell = i => {
		if(!this.props.parent.solving){
			this.props.parent.toggleBulb(i);
		}
	}
	render(){
		let parent = this.props.parent;
		let {x:w, y:h} = parent.state.size;
		return <div className="puzzle-body-container" style={{"--w": w, "--h": h}}>
			<div className="puzzle-body">
				{newArray(w * h, i=> <PuzzleCell 
					key={i} 
					id={i} 
					parent={this} 
					on={parent.getBulb(i)}
				/>)}
			</div>
		</div>
	}
}

class PuzzleCell extends Component {
	onClick = () => {
		this.props.parent.toggleCell(this.props.id);
	}
	render(){
		return <div className={`cell ${this.props.on ? "lit" : "unlit"}`} onClick={this.onClick}></div>
	}
}

ReactDOM.render(<React.StrictMode>
	<PuzzleContainer/>
</React.StrictMode>, document.getElementById("root"))