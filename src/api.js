const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


const { port, connectionString, privateKey} = require('../config');


mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
const Schema = mongoose.Schema;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', () => {
    console.log('Connected to database');
})

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.listen(process.env.PORT || port, () => {
    console.log('Server is running');
})


const RecordSchema = new Schema({
    recordId: Number,
    name: String,
    numberOfHomes: Number,
    numberOfDeservingHomes: Number,
    bloodDonors: Number,
    mosoolName: String,
    numberKhidmatKametiMembers: Number,
    numberOfWorkers: Number,
    population: Number,
    contactNumber: String,
    code: String,
    area: String,
    recordType: String,
    parentRecord: String,
    numberOfBlockCodes: Number,
    numberOfUCs: Number
});
const UsersSchema = new Schema({
    username: String,
    password: String,
    entityId: String,
    entityType: String
});
const PoliticalWingSchema = new Schema({
    chairman: String,
    viceChairman: String,
    generalCounceler: String,
    youthCounceler: String,
    labourCounceler: String,
    ladyCounceler: String,
    minorityCounceler: String,
    parentRecordId: String
});
const KhidmatCommitteeSchema = new Schema({
    head: String,
    president: String,
    vicePresident: String,
    generalSecretary: String,
    financeSecretary: String,
    jointSecretary: String,
    mediaSecretary: String,
    youthPresident: String,
    studentsPresident: String,
    womenPresident: String,
    bloodSocietyPresident: String,
    condolenceCommittee: String,
    ayadatCommittee: String,
    prayerCommittee: String,
    safaiCommittee: String,
    streetLightsPresident: String,
    dawatOIslahPresident: String,
    legalAidPresident: String,
    rozaSocietyPresident: String,
    minorityPresident: String,
    rikshawUnionPresident: String,
    labourPresident: String,
    teachersPresident: String,
    musaalihatiCommittee: String,
    parentRecordId: String
});

const Record = mongoose.model('Record', RecordSchema);
const User = mongoose.model('user', UsersSchema);
const KhdimatCommittee = mongoose.model('KhidmatCommittee', KhidmatCommitteeSchema);
const PoliticalWing = mongoose.model('PoliticalWing', PoliticalWingSchema);


app.get('/', (req, res) => {
    res.json({message: 'Hello World'})
})
app.get('/api/data/getAllRecords', verifyToken, (req, res) => {
    const { recordType, parentRecordId } = req.query;
    Record.find().then(records => res.json(records.filter(record => record.recordType === recordType && (parentRecordId === '' || parentRecordId === undefined || parentRecordId === null ? true : parentRecordId === record.parentRecord))));
});
app.post('/api/data/addNewRecord', verifyToken, (req, res) => {
    if(req.body._id){
        const primaryKey = req.body._id;
        const recordToUpdate = req.body;
        delete recordToUpdate._id;
        db.collection('records').updateOne({_id: mongoose.Types.ObjectId(primaryKey)}, {$set: recordToUpdate})
        .then(resp => res.json(resp));
    }
    const record = new Record(Object.assign({}, req.body));
    record.save((err, item) => {
        if(err) return console.error(err);
        res.send(item);
    })
});
app.get('/api/data/getRecordById', verifyToken, (req, res) => {
    Record.findById(mongoose.Types.ObjectId(req.body._id)).then(item => res.json(item));
})
app.get('/api/data/getChildRecods', verifyToken, (req, res) => {
    Record.find().then(items => res.json(items.filter(item => item.ParentRecord === req.body.parentRecordId)));
});
app.delete('/api/data/deleteRecord/:id', (req, res) => {
    const id = req.params.id;
    Record.remove({_id: mongoose.Types.ObjectId(id)}, err => {
        if(err) return res.send(err);
        res.send({message: 'successfully deleted'});
    })
});
app.get('/api/data/getPoliticalWing', verifyToken, (req, res) => {
    const { parentRecordId } = req.query;
    PoliticalWing.find({ parentRecordId: parentRecordId }).then(PW => res.json(PW));
});
app.get('/api/data/getKhidmatCommittee', verifyToken, (req, res) => {
    const { parentRecordId } = req.query;
    KhdimatCommittee.find({ parentRecordId: parentRecordId }).then(KC => res.json(KC));
});
app.post('/api/data/addKhidmatCommittee', verifyToken, (req, res) => {
    
    if(req.body._id){
        const recordToUpdate = req.body;
        delete recordToUpdate._id;
        db.collection('khidmatcommittees').updateOne({parentRecordId: req.body.parentRecordId}, {$set: recordToUpdate})
        .then(resp => res.json(resp));
    }
    else{
        const khidmatCommittee = new KhdimatCommittee(Object.assign({}, req.body));
        khidmatCommittee.save((err, item) => {
            if(err) return res.json({error: true});
            res.send({error: false, item: item});
        })
    }
});
app.post('/api/data/addPoliticalWing', verifyToken, (req, res) => {
    if(req.body._id){
        const politicalWingToUpdate = req.body;
        delete politicalWingToUpdate._id;
        db.collection('politicalwings').updateOne({parentRecordId: req.body.parentRecordId}, {$set: politicalWingToUpdate})
        .then(resp => res.json(resp));
    }
    else{
        const politicalWing = new PoliticalWing(Object.assign({}, req.body));
        politicalWing.save((err, item) => {
            if(err) return res.json({error: true});
            res.send({error: false, item: item});
        });
    }
})
app.get('/api/data/getChildRecods', verifyToken, (req, res) => {
    const id = req.body.parentRecordId;
    Record.find({parentRecord: id}).then(items => res.json(items));
});
app.post('/api/users/login', (req, res) => {
    User.findOne({username: req.body.username}, (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found.');
        if(req.body.password === user.password){
            const token = jwt.sign({id: user._id}, privateKey, { expiresIn: 86400 });
            res.status(200).send({ auth: true, token: token });
        }
        else
            return res.status(401).send({ auth: false, token: null });
    })
});
function verifyToken(req, res, next){
    const token = req.headers['x-access-token'];
    if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token, privateKey, (err, decoded) => {
        if (err) return res.status(403).send({ auth: false, message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        next();
    });
}