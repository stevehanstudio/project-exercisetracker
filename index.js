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

app.use(express.urlencoded({ extended: true }))

app.get('/api/users', async (req,res) => {
  try {
    users = await User.find({}).select({ "username": 1, "_id": 1})
    res.status(200).json(users)
  } catch(err) {
    return res.status(401).json({ error: "No user found"})
  }
})

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
      _id: savedUser._id,
      username: savedUser.username,
    })
  }
  catch (err) {
    console.log('Error posting to /api/users', err)
    return res.json({ error: err })
  }
})

app.get('/api/users/:_id/exercises', async (req, res) => {
	console.log('In get /api/users/:_id/exercises')
	const { _id } = req.params
	try {
		// const { description, duration, date } = req.body
		// const exercise = {
		// 	description,
		// 	duration,
		// 	date: new Date(date).toDateString(),
		// }

		// console.log('exercise to get:', exercise)
		const user = await User.findById(_id)
		console.log('Found user:', user)

		return res.status(200).json(user)
	} catch (err) {
		console.log('Error getting /api/users/:_id/exercises', err)
		return res.json({ error: err })
	}
})

app.post('/api/users/:_id/exercises', async (req, res) => {
	console.log('In post /api/users/:_id/exercises')
	// console.log('req.body', req.body)
	// console.log('req.params._id', req.params._id)
	const { _id } = req.params
	try {
		const { description, duration, date } = req.body
    console.log('req.body', description, duration, date)
    const exercise = {
			description,
			duration: +duration,
			date: date ? (new Date(date)).toDateString() : (new Date()).toDateString()
		}

		console.log('exercise to get:', exercise)
		const user = await User.findById(_id)
    console.log('Found user:', user)
    user.count = user.count+1,
    user.log.push(exercise)
    const updatedUser = await user.save()

    // return res.json(updatedUser)

    return res.status(200).json({
      username: updatedUser.username,
      description: exercise.description,
      duration: +exercise.duration,
      date: exercise.date,
      _id: updatedUser._id
    })
	} catch (err) {
		console.log('Error posting to /api/users/:_id/exercises', err)
		return res.json({ error: err })
	}
})

// Modify the queryChain function to find people who like the food specified by the variable named foodToSearch. Sort them by name, limit the results to two documents, and hide their age. Chain .find(), .sort(), .limit(), .select(), and then .exec(). Pass the done(err, data) callback to exec().
// GET user's exercise log: GET /api/users/:_id/logs?[from][&to][&limit]
// [ ] = optional
// from, to = dates (yyyy-mm-dd); limit = number
app.get('/api/users/:_id/logs', async (req, res) => {
  console.log('In /api/users/:_id/logs')
  console.log(req.params)
  console.log('req.query', req.query)

  const { _id } = req.params
  let { from, to, limit } = req.query

  try {
    const user = await User.findById(_id)
    // if (!from && !to && !limit) {
    //   return res.status(200).json(user)
    // }
    if (!from) {
      from = '1970-01-01'
    }
		if (!to) {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      to = tomorrow
      console.log(today, to)
      to = to.toISOString()
      console.log('toISOString', to)
    }
		if (!limit) {
      limit = user.count
    }

    console.log('user', user)
    const exercises = user.log.filter(exercise => {
      const exercise_date = new Date(exercise.date)
      const from_date = new Date(from).getTime()
      const to_date = new Date(to).getTime()

      console.log(`exercise.date=${exercise.date}, from_date=${from_date}, to_date=${to_date}`)
      return (
        exercise_date.getTime() >= from_date &&
        exercise_date.getTime() <= to_date
      )
    }).map(exercise => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
        // date: new Date(exercise.date).toDateString()
      }
    })
    const queried_log = exercises.slice(0, limit)
    const queried_user = {
			username: user.username,
			count: user.count, // queried_log.length,
			_id: user._id,
			log: queried_log,
		}
    console.log('queried_user', queried_user)
    return res.json(queried_user)
  }
  catch (err) {
    console.log("Error:", err);
    return res.status(401).json({ error: 'invalid user'})
  }

  // else {
  //   const user = User.findById(_id)
  //     .where('log.date').gte(new Date(from)).lte(new Date(to))
  //     .sort('log.date')
  //     .limit(limit)
  //     .exec((err, result) => {
  //       if (err) {
  //         console.log('Error', err)
  //       } else {
  //   })
//  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
