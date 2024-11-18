
export class GameGenerator {
    private characterCount: number;
    private validGenerator: boolean = true;
    private grid: string[];
    private words: string[];
    private rows: number;
    private columns: number;

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

        this.words = Array.from(words.values());
        this.rows = rows;
        this.columns = columns;
        this.grid = new Array<string>(this.characterCount);
    }

    public generate(): string[] {
        if(!this.validGenerator) {
            console.error("Generator parameters are not valid!");
            return [];
        }
        else {
            while(!this.fillGrid()) {
                this.grid = new Array<string>(this.characterCount);
            }
            return this.grid;
        }
    }

    public debugPrintGame(): void {
        this.getGrid().forEach((row: string[]) => {
            let joined: string = row.join("', '");
            console.debug("'" + joined + "'");
        })
    }

    public getGrid(): string[][]{
        let result: string[][] = [];
        for(let i:number = 0; i < this.rows; i++) {
            let start: number = i * this.columns;
            let last: number = start + this.columns;
            result.push(this.grid.slice(start,last).map(c => c ?? ' '))
        }
        return result;
    }

    private getRandomInt(): number  {
        return Math.floor(Math.random() * this.characterCount);
    }

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

    private trySetCharacter(next: number, previousCell: number | null, character: string): boolean {
        if(this.isAdjacentCell(next, previousCell)) {
            this.grid[next] = character;
            return true;
        }
        return false;
    }

    private isAdjacentCell(nextCell: number, previousCell: number | null): boolean {
        if(previousCell == null) 
            return true;
        let adjacentCells:number[] = this.getAdjacentCells(nextCell);
        if(adjacentCells.some(cell => cell == previousCell))
            return true;
        return false;
    }

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