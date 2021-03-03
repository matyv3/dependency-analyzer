import { JSDOM } from 'jsdom'
import path from 'path'
import * as Excel from "exceljs";
import axios from 'axios';
import fs from 'fs';

type Resource = {
	name: string,
	byteLength: number,
	url: string,
	frecuency: number
}

type SiteDependency = {
	resources: Resource[],
	name: string,
}

export default class Analyzer {

	private sites: Map<string, string> = new Map();
	private result: SiteDependency[] = []

	constructor(
		private filePath: string,
	){ }

	private isUrl(url: string): boolean {
		let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
								 '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
								 '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
								 '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
								 '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
								 '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		return !!pattern.test(url);
	}

	private async getResources(url: string): Promise<Resource[]>{
		let resources: Resource[] = []
		const dom = this.isUrl(url) 
			? await JSDOM.fromURL(url, { runScripts: "outside-only"  })
			: await JSDOM.fromFile(url)
 
		let scripts = dom.window.document.getElementsByTagName('script')
		for(let i=0; i < scripts.length -1; i++){
			let script = scripts[i]
			if(script.src){
				let name = this.getResourceName(script.src)
				let resource = resources.find(res => res.name === name)
				let frecuency = 1
				if(resource) frecuency = resource.frecuency +1;

				resources.push({
					url: script.src,
					byteLength: await this.getResourceLength(script.src),
					name,
					frecuency
				})
			}
		}
		return resources
	}

	private parseSrc(url: string): string{
		return url.replace('file://', '').replace(/%20/g, " ")
	}

	private async getResourceLength(url: string): Promise<number>{
		if(this.isUrl(url)){
			const lengthData = await axios.get(url)
			return lengthData.data.length
		}
		url = this.parseSrc(url)
		const stats = fs.statSync(url)
		return stats.size
	}

	private getResourceName(url: string){
		let name = url.split('/')?.pop()?.split('#')[0]?.split('?')[0]	
		if(!name) throw new Error('Could not retrieve resource name');
		return name
	}

	private async getSitesFromCSV(){
		const NAME_COL = 1
		const PATH_COL = 2

		const workbook = new Excel.Workbook();
		const worksheet = await workbook.csv.readFile(path.join(__dirname, '../' + this.filePath));
		const that = this;
		worksheet.eachRow(function(row, rowNumber) {
			if(rowNumber == 1) return;

			let cell = row.getCell(NAME_COL)
			if(!cell.value) return;
			let sitePath = row.getCell(PATH_COL)
			if(!sitePath) return;

			const exists = that.sites.get(cell.value.toString())
			if(!exists) that.sites.set(cell.value.toString(), sitePath.toString())
		})
	}

	private removeTmpFile(){
	  fs.unlinkSync(path.join(__dirname, '../' + this.filePath))
	}

	public async getDependencies(){
		await this.getSitesFromCSV()
		for(let key of this.sites.keys()){
			const url = this.sites.get(key)
			if(!url) throw new Error('Site path not found');
			const resources = await this.getResources(url)
			this.result.push({
				name: key,
				resources
			})
		}
		this.removeTmpFile()
		return this.result
	}
}
