/**
 * Creates new grid layout from given words
 * words: Solution words for game
 * rows: number of rows in grid
 * columns: number of columds in grid
 */
export class GameGenerator {
    private characterCount: number; //Total character count
    private validGenerator: boolean = true; //Is generator in valid state to create game
    private grid: string[]; //grid
    private words: string[]; //words for solution
    private rows: number; //number of rows
    private columns: number; //number of columns

    constructor(words: Set<string>, rows: number, columns: number) {
        if(!Number.isInteger(rows)) {
            this.validGenerator = false;
            console.error("Row count must be integer");
        }
        if(!Number.isInteger(columns)) {
            this.validGenerator = false;
            console.error("Column count must be integer");
        }
        this.words = Array.from(words.values()).map((word) => word?.trim());
        this.characterCount = this.words.reduce((count: number, word: string) => {return count + (word?.length ?? 0);}, 0)
        if(this.characterCount == 0) {
            this.validGenerator = false;
            console.error("Words cannot be empty");
        }
        if(this.characterCount > (rows * columns)) {
            this.validGenerator = false;
            console.error("Too many characters");
        }
        else if (this.characterCount < (rows * columns)) {
            this.validGenerator = false;
            console.error("Too few characters");
        }

        if(rows < 2 || columns < 2) {
            this.validGenerator = false
            console.error("Number of rows nor colums cannot be less than 2");
        }

        if(!this.validGenerator)
            throw("Generator cannot be created with given parameters");

        this.words = Array.from(words.values());
        this.rows = rows;
        this.columns = columns;
        this.grid = new Array<string>(this.characterCount);
    }

    /**
     * Generates new layout with given words
     * @returns grid layout
     */
    public generate(): string[][] {
        if(!this.validGenerator) {
            console.error("Generator parameters are not valid!");
            return [];
        }
        else {
            this.grid = new Array<string>(this.characterCount);
            while(!this.fillGrid()) {
                this.grid = new Array<string>(this.characterCount);
            }
            return this.getGrid();
        }
    }

    /**
     * Prints current grid layout
     */
    public debugPrintGame(): void {
        this.getGrid().forEach((row: string[]) => {
            let joined: string = row.join("', '");
            console.debug("'" + joined + "'");
        })
    }

    /**
     * Get current layout
     */
    public getGrid(): string[][]{
        let result: string[][] = [];
        for(let i:number = 0; i < this.rows; i++) {
            let start: number = i * this.columns;
            let last: number = start + this.columns;
            result.push(this.grid.slice(start,last).map(c => c ?? ' '))
        }
        return result;
    }

    /**
     * Random integer generator
     * @returns integer between 0 and character count
     */
    private getRandomInt(): number  {
        return Math.floor(Math.random() * this.characterCount);
    }

    /**
     * Tries to fill grid
     * @returns true if filling was success
     */
    private fillGrid(): boolean  {
        let filledCounter: number = 0;
        let success = true;
        //Iterate over each word
        this.words.forEach((word: string) => {
            let previousCell: number | null = null; //Track previous character cell
            //Iterate over each character
            Array.from(word).forEach((character: string) => {
                let filledCell: number | null = this.tryInsertCharacter(character, filledCounter, previousCell);
                if(filledCell == null) {
                    success = false;
                    return; //failed to add character
                }

                previousCell = filledCell;
                filledCounter++;
            });
            if(!success)
                return;
        });
        return success;
    }

    /**
     * Try insert single character into random position in grid
     * @param character character to be inserted
     * @param filledCounter how many characters filled before
     * @param previousCell previous cell used
     * @returns which cell was filled
     */
    private tryInsertCharacter(character: string, filledCounter: number, previousCell: number | null): number | null {
        let checkedCells: number[] = [];
        let breakAfter: number = 1000;
        while (breakAfter > 0) { //prevent infinite loops
            let next: number = this.getRandomInt();
            //Get random next empty cell
            while(this.grid[next] != null) {
                next = this.getRandomInt();
            }

            if(!checkedCells.some(checked => checked == next)) {
                if(this.trySetCharacter(next, previousCell, character))
                    return next;
                else {
                    checkedCells.push(next);
                    breakAfter--;
                }
            }
            //there is no solution since we have tried all free cells
            else if(checkedCells.length + filledCounter == this.characterCount)
                return null;
        }
        return null;
    }

    /**
     * Try set character into given next cell position
     * @param next next cell position
     * @param previousCell previous cell position
     * @param character character
     * @returns true if success
     */
    private trySetCharacter(next: number, previousCell: number | null, character: string): boolean {
        if(this.isAdjacentCell(next, previousCell)) {
            this.grid[next] = character;
            return true;
        }
        return false;
    }

    /**
     * Is next cell adjacent to previous cell
     * @param nextCell next cell
     * @param previousCell  previous cell
     * @returns true if adjacent
     */
    private isAdjacentCell(nextCell: number, previousCell: number | null): boolean {
        if(previousCell == null) 
            return true;
        let adjacentCells:number[] = this.getAdjacentCells(nextCell);
        if(adjacentCells.some(cell => cell == previousCell))
            return true;
        return false;
    }

    /**
     * List adjacent cells to given one
     * @param cell target cell
     * @returns adjacent cells
     */
    private getAdjacentCells(cell: number): number[] {
        let column: number = cell % this.columns;
        let leftCol: boolean = column == 0;
        let rightCol: boolean = column == this.columns - 1;
        let topRow: boolean = cell < this.columns;
        let bottomRow: boolean = cell > ((this.rows - 1) * this.columns) -1;

        let result2: number[] = []; 
        if(!leftCol)
            result2.push(cell - 1); //left

        if(!rightCol)
            result2.push(cell + 1); //right

        if(!topRow) {
            let up:number = cell - this.columns;
            result2.push(cell - this.columns); //top
            if(!leftCol)
                result2.push(up - 1); //top left
            if(!rightCol)
                result2.push(up + 1); //top right
        }

        if(!bottomRow) {
            let down: number = cell + this.columns;
            result2.push(down); //bottom
            if(!leftCol)
                result2.push(down - 1); //bottom left
            if(!rightCol)
                result2.push(down + 1); //bottom right
        }
        return result2;
    }
}