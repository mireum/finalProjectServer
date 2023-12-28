const express = require('express');
const { ObjectId } = require('mongodb');

// S3
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');


const { client } = require('../database/index');
const db = client.db('lastTeamProject');

const router = express.Router();
// S3
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
  },
  region: 'ap-northeast-2'
});

// S3 클라이언트
const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'finaltp',
    key(req, file, cb) {
      cb(null, `original/${Date.now()}_${file.originalname}`)
    }
  }),
  limits: { fieldSize: 5 * 1024 * 1024 }
});

// 모든 커뮤니티 정보
router.get('/', async (req, res) => {
  try {
    const data = await db.collection('community').find({}).toArray();
    res.json({
      flag: true,
      message: '데이터 불러오기 성공(커뮤니티)',
      data
    });
  } catch (err) {
    console.error(err);
  }
});

// 자랑 커뮤니티
router.get('/brag', async (req, res) => {
  try {
    const data = await db.collection('community').find({ type: 'brag' }).toArray();
    res.json({
      flag: true,
      message: '데이터 불러오기 성공(커뮤니티)',
      data
    });
  } catch (err) {
    console.error(err);
  }
});
router.get('/brag/detail/:postId', async (req, res) => {
  const postId = req.params.postId
  const postData = await db.collection('community').findOne({ _id: new ObjectId(postId) });
  const userData = await db.collection('userInfo').findOne({ _id: postData._id });
  const commentData = await db.collection('comment').find({ postId: new ObjectId(postId) }).toArray();
  res.json({
    flag: true,
    message: '데이터 불러오기 성공(상세보기)',
    postData,
    userData,
    commentData
  });
});

// 커뮤니티 삽입_자랑
router.post('/brag/insert', upload.single('img'), async (req, res) => {
  // const userId = req.user._id;
  // const inputdata = req.body.inputdata;
  const title = req.body.title;
  const content = req.body.content;
  const author = req.body.author;
  const imgUrl = req.file?.location || '';
  const imgKey = req.file?.key || '';

  try {
    // await db.collection('community').insertOne({...inputdata, userId, imgUrl});
    await db.collection('community').insertOne({ title, content, author, imgUrl, imgKey, type: 'brag'});
    res.json({
      flag: true,
      message: '데이터 저장 성공(커뮤니티_자랑)'
    });
  } catch (err) {
    console.error(err);
  }
});

// 수정 (이미지)_자랑
router.patch('/brag/edit/:postId', upload.single('img'), async (req, res) => {
  const thisPost = await db.collection('community').findOne({ _id: req.params.postId });
  console.log(req.file);
  const title = req.body.title;
  const content = req.body.content;
  const author = req.body.author;
  const imgUrl = req.file?.location || '';
  const imgKey = req.file?.key || '';

  // aws에서 데이터 삭제
  const bucketParams = { Bucket: 'finaltp', Key: thisPost.imgKey };
  const run = async () => {
    try {
      const data = await s3.send(new DeleteObjectCommand(bucketParams))
      console.log('성공', data);
    } catch (err) {
      console.error(err);
    }
  };
  try {
    // await db.collection('community').insertOne({...inputdata, userId, imgUrl});
    await db.collection('community').updateOne({ _id: thisPost._id }, { $set: { title, content, author, imgUrl, imgKey } });
    run();
    res.json({
      flag: true,
      message: '데이터 수정 성공(커뮤니티_자랑)'
    });
  } catch (err) {
    console.error(err);
  }
});
// 삭제_자랑
router.delete('/brag/delete/:postId', async (req, res) => {
  const postId = req.params.postId;
  try {
    const thisPost = await db.collection('community').findOne({ _id: req.params.postId });
    const bucketParams = { Bucket: 'finaltp', Key: thisPost.imgKey };
    const run = async () => {
      try {
        const data = await s3.send(new DeleteObjectCommand(bucketParams))
        console.log('성공', data);
      } catch (err) {
        console.error(err);
      }
    };
    await db.collection('community').deleteOne({ _id: new ObjectId(postId) });
    run();
    res.json({
      flag: true,
      message: '데이터를 성공적으로 지웠습니다.'
    });
  } catch (err) {
    console.error(err);
  }
});

// 댓글달기_자랑
router.post('/brag/comment/:postId', async (req, res) => {
  const postId = req.params.postId;
  const user = req.user._id;
  const username = req.user.username;
  const comment = req.body.comment;
  const date = req.body.date;
  try {
    await db.collection('comment').insertOne({
      user,
      username,
      comment,
      date,
      postId: new ObjectId(postId),
      type: 'brag'
    });
    res.json({
      flag: true,
      message: '성공적으로 댓글이 등록되었습니다.'
    });
  } catch (err) {
    console.error(err);
  }
});


// 육아톡톡 커뮤니티
router.get('/talk', async (req, res) => {
  try {
    const data = await db.collection('community').find({ type: 'talk' }).toArray();
    res.json({
      flag: true,
      message: '데이터 불러오기 성공(육아톡톡)',
      data
    });
  } catch (err) {
    console.error(err);
  }
});
router.get('/talk/detail/:postId', async (req, res) => {
  const postId = req.params.postId
  const postData = await db.collection('community').findOne({ _id: new ObjectId(postId) });
  const userData = await db.collection('userInfo').findOne({ _id: postData._id });
  const commentData = await db.collection('comment').find({ postId: new ObjectId(postId) }).toArray();
  res.json({
    flag: true,
    message: '데이터 불러오기 성공(상세보기)',
    postData,
    userData,
    commentData
  });
});

// 커뮤니티 삽입_자랑
router.post('/talk/insert', upload.single('img'), async (req, res) => {
  // const userId = req.user._id;
  // const inputdata = req.body.inputdata;
  const title = req.body.title;
  const content = req.body.content;
  const author = req.body.author;
  const imgUrl = req.file?.location || '';
  const imgKey = req.file?.key || '';

  try {
    // await db.collection('community').insertOne({...inputdata, userId, imgUrl});
    await db.collection('community').insertOne({ title, content, author, imgUrl, imgKey, type: 'talk'});
    res.json({
      flag: true,
      message: '데이터 저장 성공(커뮤니티_육아톡톡)'
    });
  } catch (err) {
    console.error(err);
  }
});

// 수정 (이미지)_자랑
router.patch('/talk/edit/:postId', upload.single('img'), async (req, res) => {
  const thisPost = await db.collection('community').findOne({ _id: req.params.postId });
  console.log(req.file);
  const title = req.body.title;
  const content = req.body.content;
  const author = req.body.author;
  const imgUrl = req.file?.location || '';
  const imgKey = req.file?.key || '';

  // aws에서 데이터 삭제
  const bucketParams = { Bucket: 'finaltp', Key: thisPost.imgKey };
  const run = async () => {
    try {
      const data = await s3.send(new DeleteObjectCommand(bucketParams))
      console.log('성공', data);
    } catch (err) {
      console.error(err);
    }
  };
  try {
    // await db.collection('community').insertOne({...inputdata, userId, imgUrl});
    await db.collection('community').updateOne({ _id: thisPost._id }, { $set: { title, content, author, imgUrl, imgKey } });
    run();
    res.json({
      flag: true,
      message: '데이터 수정 성공(커뮤니티_육아톡톡)'
    });
  } catch (err) {
    console.error(err);
  }
});
// 삭제_자랑
router.delete('/talk/delete/:postId', async (req, res) => {
  const postId = req.params.postId;
  try {
    const thisPost = await db.collection('community').findOne({ _id: req.params.postId });
    const bucketParams = { Bucket: 'finaltp', Key: thisPost.imgKey };
    const run = async () => {
      try {
        const data = await s3.send(new DeleteObjectCommand(bucketParams))
        console.log('성공', data);
      } catch (err) {
        console.error(err);
      }
    };
    await db.collection('community').deleteOne({ _id: new ObjectId(postId) });
    run();
    res.json({
      flag: true,
      message: '데이터를 성공적으로 지웠습니다.'
    });
  } catch (err) {
    console.error(err);
  }
});

// 댓글달기_자랑
router.post('/talk/comment/:postId', async (req, res) => {
  const postId = req.params.postId;
  const user = req.user._id;
  const username = req.user.username;
  const comment = req.body.comment;
  const date = req.body.date;
  try {
    await db.collection('comment').insertOne({
      user,
      username,
      comment,
      date,
      postId: new ObjectId(postId),
      type: 'talk'
    });
    res.json({
      flag: true,
      message: '성공적으로 댓글이 등록되었습니다.'
    });
  } catch (err) {
    console.error(err);
  }
});






// ---------------------------shop


// 쇼핑몰아이템 삽입
router.post('/insertShopItem', upload.single('img'), async (req, res) => {
  // const userId = req.user._id;
  // const inputdata = req.body.inputdata;
  const brand = req.body.brand;
  const title = req.body.title;
  const price = req.body.price;
  const age = req.body.age;
  const size = req.body.size;
  const tag = req.body.tag;
  const imgUrl = req.file?.location || '';
  // imgUrl 뒤에 키값이 있으니까 
  // 앞의 값은 env 에 저장해서 꺼내쓰고 키값만 imgUrl에 저장해도되고
  // 두개를 따로 나눠서 저장해도되고 선택!
  const imgKey = req.file?.key || '';

  try {
    await db.collection('shop').insertOne({ brand, title, price, age, size, tag, imgUrl, imgKey });
    res.json({
      flag: true,
      message: '데이터 저장 성공(쇼핑)'
    });
  } catch (err) {
    console.error(err);
  }
});
// 수정 (이미지)
router.post('/brag/editShopItem/:itemId', upload.single('img'), async (req, res) => {
  const thisItem = await db.collection('shop').findOne({ _id: req.params.itemId });
  console.log(req.file);
  const brand = req.body.brand;
  const title = req.body.title;
  const price = req.body.price;
  const age = req.body.age;
  const size = req.body.size;
  const tag = req.body.tag;
  const imgUrl = req.file?.location || '';
  const imgKey = req.file?.key || '';

  // aws에서 데이터 삭제
  // const bucketParams = { Bucket: 'finaltp', Key: 'original/1703139078070_feed_01.jpg' };
  const bucketParams = { Bucket: 'finaltp', Key: thisItem.imgKey };
  const run = async () => {
    try {
      const data = await s3.send(new DeleteObjectCommand(bucketParams))
      console.log('성공', data);
    } catch (err) {
      console.error(err);
    }
  };
  try {
    // await db.collection('community').insertOne({...inputdata, userId, imgUrl});
    await db.collection('shop').updateOne({ _id: thisItem._id }, { $set: { brand, title, price, age, size, tag, imgUrl, imgKey } });
    run();
    res.json({
      flag: true,
      message: '데이터 수정 성공(쇼핑)'
    });
  } catch (err) {
    console.error(err);
  }
});

router.get('/shop', async (req, res) => {
  let posts;
  if (req.query.nextId) {
    posts = await db.collection('shop').find({ _id: { $gt: new ObjectId(req.query.nextId) } }).limit(8).toArray();
  } else {
    posts = await db.collection('shop').find({}).limit(8).toArray();
  }
  // res.render('write.ejs', { posts })
  res.json({
    flag: true,
    message: '성공적으로 상품을 가져왔습니다.',
    posts
  });
});
module.exports = router;