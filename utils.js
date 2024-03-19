import { fileURLToPath } from 'url'
import { dirname } from 'path' //Devuelve el nombre del directorio, es decir, la ruta absoluta
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url) //Esto es para trabajaro con rutas absolutas
const __dirname = dirname(__filename)

export default __dirname;

//Configuración de Multer:
const storage = multer.diskStorage({
	//ubicacion del directorio donde voy a guardar los archivos
	destination: function(request, file, cb){
		cb(null, `${__dirname}/src/public/img`) //Vamos a guardar en una carpata llamada "img" dentro de public
	},
	//El nombre que quiero que tengan los archivos que se suban:
	filename: function(req, file, cb) {
		cb(null, `${Date.now()}-${file.originalname}`) //Llamaremos al archivo con esta estructura: fechaActual-NombredelArchivo
	}
})


//Lo exportamos:
export const uploader = multer({
	storage, 
	//si se genera algun error, lo capturamos
	onError: function (err, next){
		console.log(err)
		next()
	}
})