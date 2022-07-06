const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose
	.connect(process.env.MONGO_URI, { useNewUrlParser: true })
	.then(() => {
		console.log('Database connection successful')
	})
	.catch(err => {
		console.error('Database connection error')
	})

const ExerciseSchema = new mongoose.Schema({
	description: {
		type: String,
	},
	duration: {
		type: Number,
		required: true,
	},
	date: {
		type: String,
		required: true,
	},
})

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true,
	},
  count: Number,
  log: [ExerciseSchema]
})

User = mongoose.model('User', UserSchema)
// Exercise = mongoose.model('Exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded())

app.post('/api/users', async (req, res) => {
  // console.log('In /api/users')
  // console.log(req.body.username)
  const { username } = req.body

  try {
    const newUser = User({
      username,
      count: 0,
      log: []
    })
    const savedUser = await newUser.save()
    return res.status(200).json({
      id: savedUser._id,
      username: savedUser.username,
    })
  }
  catch (err) {
    console.log('Error posting to /api/users', err)
    return res.json({ error: err })
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
	// console.log('In /api/users/:_id/exercises')
	// console.log(req.body)
	// console.log(req.params._id)
	const { _id } = req.params
	try {
		const { description, duration, date } = req.body
    const exercise = {
			description,
			duration,
			date: (new Date(date)).toDateString()
		}

		// console.log('exercise:', exercise)
		const user = await User.findById(_id)
    // console.log('user:', user)
    user.count = user.count+1,
    user.log.push(exercise)
    const updatedUser = await user.save()

    return res.status(200).json(updatedUser)
	} catch (err) {
		console.log('Error posting to /api/users/:_id/exercises', err)
		return res.json({ error: err })
	}
})

// GET user's exercise log: GET /api/users/:_id/logs?[from][&to][&limit]
// [ ] = optional
// from, to = dates (yyyy-mm-dd); limit = number
app.get('/api/users/:_id/logs', async (req, res) => {
  // console.log('In /api/users/:_id/logs')
  // console.log(req.params)
  // console.log('req.query', req.query)
  try {
    const { _id } = req.params
    const { from, to, limit } = req.query
    user = await User.findById(_id)
    return res.json(user)
  } catch (err) {
    console.log(err)
    return res.status(401).json({ error: 'invalid user'})
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
