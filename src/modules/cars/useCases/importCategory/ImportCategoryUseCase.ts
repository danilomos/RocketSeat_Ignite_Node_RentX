import csvParse from 'csv-parse';
import fs from 'fs';

import { ICategoriesRepository } from '../../repositories/ICategoriesReposity';

interface IImportCategory {
    name: string;
    description: string;
}

class ImportCategoryUseCase {
    constructor(private categoriesRepository: ICategoriesRepository) {}

    loadCategories(file: Express.Multer.File): Promise<IImportCategory[]> {
        const categories: IImportCategory[] = [];
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(file.path);

            const parseFile = csvParse();
            stream.pipe(parseFile);

            parseFile
                .on('data', async line => {
                    console.log(line);
                    const [name, description] = line;

                    categories.push({ name, description });
                })
                .on('end', () => {
                    resolve(categories);
                })
                .on('error', error => {
                    reject(error);
                });
        });
    }

    async execute(file: Express.Multer.File): Promise<void> {
        const categories = await this.loadCategories(file);
        categories.map(async category => {
            const { name, description } = category;

            const existCategory = this.categoriesRepository.findByName(name);
            if (!existCategory) {
                this.categoriesRepository.create({
                    name,
                    description,
                });
            }
        });
    }
}

export { ImportCategoryUseCase };