import express from 'express';
import multer from 'multer';
import Analyzer from './Analyzer';
import path from 'path';

const upload = multer({
	dest: 'uploads',
	fileFilter: (req, file, cb) => {
		if (file.mimetype == "text/csv") {
			cb(null, true);
		} else {
			cb(null, false);
			return cb(new Error('Only .csv format allowed!'));
		}
	},
})
const fileUpload = upload.single('file')

const app = express();
const PORT = 3000;

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use(express.static(path.join(__dirname, '../public')))

app.post('/', (req, res) => {
	fileUpload(req, res, async (err: any) => {
		if(err) return res.status(400).send({ error: err.message })
		if(!req.file) return res.status(400).send({ error: 'CSV file is needed' })
		const analyzer = new Analyzer(req.file.path)
		try{
			const results = await analyzer.getDependencies()
			res.send({ results })
		}catch(err){
			res.status(400).send({ error: err.message })
		}
	})
});


app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
