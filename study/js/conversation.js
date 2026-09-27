/* =========================================================
   えいかいわロード：英語で会話ができることを ゴールにした ステップ
   各ステップ
     title : 子ども向けの ステップ名
     cando : 保護者向けの「できるようになること」
     g     : 目安の学年（0=年少 … 8=小6）
     items : つかう ひょうげん { en, ja, e: 絵, b: 穴うめにする語 }
     talk  : やりとり { q: しつもん, a: こたえ, qja, aja, e: こたえの絵 }
   ========================================================= */
window.CONV_STEPS = [
  {
    id: 'hello', g: 0, icon: '👋',
    title: 'あいさつが できる',
    cando: '「こんにちは」「ありがとう」など、基本のあいさつを英語で言える・聞いてわかる',
    items: [
      { en: 'Hello!', ja: 'こんにちは', e: '👋' },
      { en: 'Good morning!', ja: 'おはよう', e: '🌅', b: 'morning' },
      { en: 'Good night!', ja: 'おやすみ', e: '🌙', b: 'night' },
      { en: 'Goodbye!', ja: 'さようなら', e: '🚶' },
      { en: 'Thank you!', ja: 'ありがとう', e: '🎁' },
      { en: 'Sorry.', ja: 'ごめんね', e: '🙇' },
      { en: 'See you!', ja: 'またね', e: '✋' },
    ],
    talk: [
      { q: 'Thank you!', qja: 'ありがとう！', a: "You're welcome.", aja: 'どういたしまして', e: '😊' },
      { q: 'Good morning!', qja: 'おはよう！', a: 'Good morning!', aja: 'おはよう！', e: '🌅' },
      { q: 'Sorry.', qja: 'ごめんね', a: "That's OK.", aja: 'だいじょうぶだよ', e: '👌' },
    ],
  },
  {
    id: 'feel', g: 0, icon: '😊',
    title: 'きもちを つたえられる',
    cando: '「How are you?」に答えて、元気・うれしい・ねむいなどの気持ちを言える',
    items: [
      { en: "I'm fine.", ja: 'げんきだよ', e: '🙂', b: 'fine' },
      { en: "I'm happy.", ja: 'うれしい', e: '😄', b: 'happy' },
      { en: "I'm sad.", ja: 'かなしい', e: '😢', b: 'sad' },
      { en: "I'm hungry.", ja: 'おなかが すいた', e: '🤤', b: 'hungry' },
      { en: "I'm sleepy.", ja: 'ねむい', e: '😪', b: 'sleepy' },
      { en: "I'm hot.", ja: 'あつい', e: '🥵' },
      { en: "I'm cold.", ja: 'さむい', e: '🥶' },
    ],
    talk: [
      { q: 'How are you?', qja: 'げんき？', a: "I'm fine, thank you.", aja: 'げんきだよ、ありがとう', e: '🙂' },
      { q: 'Are you hungry?', qja: 'おなか すいた？', a: 'Yes, I am.', aja: 'うん、すいた', e: '🤤' },
      { q: 'Are you sleepy?', qja: 'ねむい？', a: "No, I'm not.", aja: 'ううん、ねむくないよ', e: '😃' },
    ],
  },
  {
    id: 'name', g: 0, icon: '🙋',
    title: 'なまえを いって あいさつできる',
    cando: '名前を聞いたり言ったりして、「はじめまして」のあいさつができる',
    items: [
      { en: 'My name is Ken.', ja: 'ぼくの なまえは ケンです', e: '🧒', b: 'name' },
      { en: "I'm Yui.", ja: 'わたしは ユイです', e: '👧' },
      { en: "What's your name?", ja: 'なまえは なに？', e: '❓', b: 'name' },
      { en: 'Nice to meet you.', ja: 'はじめまして', e: '🤝', b: 'meet' },
      { en: 'This is my friend.', ja: 'こちらは わたしの ともだちです', e: '👫', b: 'friend' },
    ],
    talk: [
      { q: "What's your name?", qja: 'なまえは なに？', a: 'My name is Ken.', aja: 'ぼくの なまえは ケンです', e: '🧒' },
      { q: 'Nice to meet you.', qja: 'はじめまして', a: 'Nice to meet you, too.', aja: 'こちらこそ、はじめまして', e: '🤝' },
      { q: 'Are you Yui?', qja: 'あなたは ユイ？', a: 'Yes, I am.', aja: 'うん、そうだよ', e: '👧' },
    ],
  },
  {
    id: 'like', g: 1, icon: '🍎',
    title: 'すきな ものを いえる',
    cando: '好きなもの・好きではないものを言い、「Do you like 〜?」に答えられる',
    items: [
      { en: 'I like apples.', ja: 'りんごが すき', e: '🍎', b: 'like' },
      { en: 'I like dogs.', ja: 'いぬが すき', e: '🐶', b: 'dogs' },
      { en: 'I like soccer.', ja: 'サッカーが すき', e: '⚽', b: 'soccer' },
      { en: "I don't like carrots.", ja: 'にんじんは すきじゃない', e: '🥕', b: "don't" },
      { en: 'Do you like cats?', ja: 'ねこは すき？', e: '🐱', b: 'Do' },
      { en: 'Yes, I do.', ja: 'うん、すき', e: '👍' },
      { en: "No, I don't.", ja: 'ううん、すきじゃない', e: '👎' },
    ],
    talk: [
      { q: 'Do you like cats?', qja: 'ねこは すき？', a: 'Yes, I do.', aja: 'うん、すき', e: '👍' },
      { q: 'Do you like snakes?', qja: 'へびは すき？', a: "No, I don't.", aja: 'ううん、すきじゃない', e: '👎' },
      { q: 'What food do you like?', qja: 'どんな たべものが すき？', a: 'I like pizza.', aja: 'ピザが すき', e: '🍕' },
      { q: 'What animal do you like?', qja: 'どんな どうぶつが すき？', a: 'I like dogs.', aja: 'いぬが すき', e: '🐶' },
    ],
  },
  {
    id: 'number', g: 1, icon: '🎂',
    title: 'かずと としを いえる',
    cando: '年齢を言ったり、「How many?」に数で答えたりできる',
    items: [
      { en: "I'm six.", ja: '6さいです', e: '6️⃣', b: 'six' },
      { en: 'How old are you?', ja: 'なんさい？', e: '🎂', b: 'old' },
      { en: 'How many?', ja: 'いくつ？', e: '🔢', b: 'many' },
      { en: 'Three apples.', ja: 'りんご 3こ', e: '🍎🍎🍎', b: 'Three' },
      { en: 'I have two dogs.', ja: 'いぬを 2ひき かっています', e: '🐶🐶', b: 'have' },
    ],
    talk: [
      { q: 'How old are you?', qja: 'なんさい？', a: "I'm six.", aja: '6さいです', e: '6️⃣' },
      { q: 'How many cats?', qja: 'ねこは なんびき？', a: 'Two cats.', aja: '2ひき', e: '🐱🐱' },
      { q: 'How many pencils do you have?', qja: 'えんぴつを なんぼん もってる？', a: 'I have five pencils.', aja: '5ほん もってるよ', e: '✏️' },
    ],
  },
  {
    id: 'what', g: 1, icon: '❓',
    title: 'なにか・なにいろか きける',
    cando: '「What\'s this?」「What color is it?」と聞いたり、答えたりできる',
    items: [
      { en: "What's this?", ja: 'これは なに？', e: '❓', b: 'this' },
      { en: "It's a ball.", ja: 'ボールだよ', e: '⚽', b: 'ball' },
      { en: "It's a cat.", ja: 'ねこだよ', e: '🐱', b: 'cat' },
      { en: 'What color is it?', ja: 'なにいろ？', e: '🎨', b: 'color' },
      { en: "It's red.", ja: 'あかだよ', e: '🔴', b: 'red' },
      { en: "It's blue.", ja: 'あおだよ', e: '🔵', b: 'blue' },
      { en: "It's big.", ja: 'おおきいね', e: '🐘', b: 'big' },
      { en: "It's small.", ja: 'ちいさいね', e: '🐭', b: 'small' },
    ],
    talk: [
      { q: "What's this?", qja: 'これは なに？', a: "It's a ball.", aja: 'ボールだよ', e: '⚽' },
      { q: 'What color is it?', qja: 'なにいろ？', a: "It's red.", aja: 'あかだよ', e: '🔴' },
      { q: 'Is it a dog?', qja: 'それは いぬ？', a: "No, it isn't. It's a cat.", aja: 'ちがうよ、ねこだよ', e: '🐱' },
    ],
  },
  {
    id: 'please', g: 3, icon: '🤝',
    title: 'おねがいや さそいが できる',
    cando: '「〜をください」「あそぼう」「てつだって」など、お願いや誘いができて、それに答えられる',
    items: [
      { en: 'Can I have some water?', ja: 'おみずを もらえますか？', e: '💧', b: 'have' },
      { en: 'Here you are.', ja: 'はい、どうぞ', e: '🤲', b: 'Here' },
      { en: "Let's play!", ja: 'あそぼう！', e: '🎈', b: 'play' },
      { en: 'Sure!', ja: 'いいよ！', e: '👌' },
      { en: 'Help me, please.', ja: 'てつだって ください', e: '🆘', b: 'Help' },
      { en: 'Please sit down.', ja: 'すわって ください', e: '🪑', b: 'sit' },
      { en: 'Wait a minute.', ja: 'ちょっと まって', e: '⏳', b: 'Wait' },
    ],
    talk: [
      { q: "Let's play tag!", qja: 'おにごっこ しよう！', a: "Sure! Let's go!", aja: 'いいよ！ いこう！', e: '🏃' },
      { q: 'Can I have some juice?', qja: 'ジュースを もらえる？', a: 'Here you are.', aja: 'はい、どうぞ', e: '🧃' },
      { q: 'Can you help me?', qja: 'てつだって くれる？', a: 'OK!', aja: 'いいよ！', e: '👌' },
    ],
  },
  {
    id: 'can', g: 3, icon: '🏊',
    title: 'できることを いえる',
    cando: '「I can 〜.」で自分にできることを言い、「Can you 〜?」に答えられる',
    items: [
      { en: 'I can swim.', ja: 'わたしは およげます', e: '🏊', b: 'swim' },
      { en: "I can't cook.", ja: 'わたしは りょうりが できません', e: '🍳', b: "can't" },
      { en: 'I can run fast.', ja: 'わたしは はやく はしれます', e: '🏃', b: 'fast' },
      { en: 'Can you ride a bike?', ja: 'じてんしゃに のれる？', e: '🚲', b: 'ride' },
      { en: 'Yes, I can.', ja: 'うん、できるよ', e: '⭕' },
      { en: "No, I can't.", ja: 'ううん、できない', e: '❌' },
      { en: 'He can play the piano.', ja: 'かれは ピアノが ひけます', e: '🎹', b: 'piano' },
    ],
    talk: [
      { q: 'Can you swim?', qja: 'およげる？', a: 'Yes, I can.', aja: 'うん、できるよ', e: '⭕' },
      { q: 'Can you cook?', qja: 'りょうり できる？', a: "No, I can't.", aja: 'ううん、できない', e: '❌' },
      { q: 'What can you do?', qja: 'なにが できる？', a: 'I can play the piano.', aja: 'ピアノが ひけるよ', e: '🎹' },
    ],
  },
  {
    id: 'time', g: 5, icon: '⏰',
    title: 'じかんや 1日の ことを はなせる',
    cando: '時刻を聞いたり答えたりして、起きる時間など毎日の生活について話せる',
    items: [
      { en: 'What time is it?', ja: 'いま なんじ？', e: '🕐', b: 'time' },
      { en: "It's seven o'clock.", ja: '7じです', e: '🕖', b: 'seven' },
      { en: 'I get up at six.', ja: '6じに おきます', e: '⏰', b: 'get' },
      { en: 'I go to bed at nine.', ja: '9じに ねます', e: '🛏️', b: 'bed' },
      { en: 'I eat breakfast.', ja: 'あさごはんを たべます', e: '🍞', b: 'breakfast' },
      { en: 'I go to school.', ja: 'がっこうへ いきます', e: '🏫', b: 'school' },
      { en: 'I do my homework.', ja: 'しゅくだいを します', e: '📝', b: 'homework' },
    ],
    talk: [
      { q: 'What time is it?', qja: 'いま なんじ？', a: "It's seven o'clock.", aja: '7じです', e: '🕖' },
      { q: 'What time do you get up?', qja: 'なんじに おきる？', a: 'I get up at six.', aja: '6じに おきます', e: '⏰' },
      { q: 'What do you do after school?', qja: 'ほうかごは なにを する？', a: 'I do my homework.', aja: 'しゅくだいを します', e: '📝' },
    ],
  },
  {
    id: 'where', g: 5, icon: '🗺️',
    title: 'ばしょを きいたり おしえたり できる',
    cando: '物のある場所や道順を聞いたり、教えたりできる（on / under / in、まっすぐ・右・左）',
    items: [
      { en: 'Where is the cat?', ja: 'ねこは どこ？', e: '🐱', b: 'Where' },
      { en: "It's under the table.", ja: 'テーブルの したです', e: '⬇️', b: 'under' },
      { en: "It's in the box.", ja: 'はこの なかです', e: '📦', b: 'in' },
      { en: "It's on the desk.", ja: 'つくえの うえです', e: '⬆️', b: 'on' },
      { en: 'Go straight.', ja: 'まっすぐ いって', e: '🛣️', b: 'straight' },
      { en: 'Turn right.', ja: 'みぎに まがって', e: '➡️', b: 'right' },
      { en: 'Turn left.', ja: 'ひだりに まがって', e: '⬅️', b: 'left' },
    ],
    talk: [
      { q: 'Where is the cat?', qja: 'ねこは どこ？', a: "It's under the table.", aja: 'テーブルの したです', e: '⬇️' },
      { q: 'Where is the station?', qja: 'えきは どこですか？', a: 'Go straight and turn left.', aja: 'まっすぐ いって、ひだりに まがってください', e: '⬅️' },
      { q: 'Where do you live?', qja: 'どこに すんでいるの？', a: 'I live in Osaka.', aja: 'おおさかに すんでいます', e: '🏠' },
    ],
  },
  {
    id: 'shop', g: 6, icon: '🛒',
    title: 'かいものや ちゅうもんが できる',
    cando: 'お店で注文したり、値段を聞いたりできる',
    items: [
      { en: 'What would you like?', ja: 'なにに なさいますか？', e: '🍽️', b: 'like' },
      { en: "I'd like a hamburger.", ja: 'ハンバーガーを ください', e: '🍔', b: 'hamburger' },
      { en: 'How much is it?', ja: 'いくらですか？', e: '💴', b: 'much' },
      { en: "It's 300 yen.", ja: '300えんです', e: '🪙', b: 'yen' },
      { en: 'Anything else?', ja: 'ほかには ありますか？', e: '➕', b: 'else' },
      { en: "That's all.", ja: 'それで ぜんぶです', e: '✅', b: 'all' },
    ],
    talk: [
      { q: 'What would you like?', qja: 'なにに なさいますか？', a: "I'd like a hamburger, please.", aja: 'ハンバーガーを ください', e: '🍔' },
      { q: 'How much is it?', qja: 'いくらですか？', a: "It's 300 yen.", aja: '300えんです', e: '🪙' },
      { q: 'Anything else?', qja: 'ほかには ありますか？', a: "No, that's all. Thank you.", aja: 'いいえ、それで ぜんぶです。ありがとう', e: '✅' },
    ],
  },
  {
    id: 'season', g: 6, icon: '🌻',
    title: 'たんじょうびや きせつの はなしが できる',
    cando: '誕生日や好きな季節、天気について話せる',
    items: [
      { en: 'When is your birthday?', ja: 'たんじょうびは いつ？', e: '🎂', b: 'birthday' },
      { en: 'My birthday is May 5th.', ja: 'たんじょうびは 5がつ5にちです', e: '🎉', b: 'May' },
      { en: 'What season do you like?', ja: 'どの きせつが すき？', e: '🍂', b: 'season' },
      { en: 'I like summer.', ja: 'なつが すきです', e: '🌻', b: 'summer' },
      { en: 'I like winter.', ja: 'ふゆが すきです', e: '⛄', b: 'winter' },
      { en: "It's sunny today.", ja: 'きょうは はれです', e: '☀️', b: 'sunny' },
      { en: "It's rainy today.", ja: 'きょうは あめです', e: '☔', b: 'rainy' },
    ],
    talk: [
      { q: 'When is your birthday?', qja: 'たんじょうびは いつ？', a: 'My birthday is May 5th.', aja: 'たんじょうびは 5がつ5にちです', e: '🎉' },
      { q: 'What season do you like?', qja: 'どの きせつが すき？', a: 'I like summer. I can swim in the sea.', aja: 'なつが すき。うみで およげるから', e: '🌻' },
      { q: "How's the weather?", qja: 'てんきは どう？', a: "It's sunny today.", aja: 'きょうは はれだよ', e: '☀️' },
    ],
  },
  {
    id: 'dream', g: 7, icon: '🌟',
    title: 'しょうらいの ゆめを はなせる',
    cando: 'なりたい職業や行きたい国を、理由をつけて言える（I want to 〜. Because 〜.）',
    items: [
      { en: 'What do you want to be?', ja: 'しょうらい なにに なりたい？', e: '🌟', b: 'want' },
      { en: 'I want to be a doctor.', ja: 'いしゃに なりたいです', e: '🧑‍⚕️', b: 'doctor' },
      { en: 'I want to be a teacher.', ja: 'せんせいに なりたいです', e: '🧑‍🏫', b: 'teacher' },
      { en: 'Why?', ja: 'どうして？', e: '🤔' },
      { en: 'Because I like animals.', ja: 'どうぶつが すきだからです', e: '🐾', b: 'Because' },
      { en: 'I want to go to Italy.', ja: 'イタリアに いきたいです', e: '🍕', b: 'go' },
      { en: 'I want to see the pyramids.', ja: 'ピラミッドを 見たいです', e: '🔺', b: 'see' },
    ],
    talk: [
      { q: 'What do you want to be?', qja: 'しょうらい なにに なりたい？', a: 'I want to be a vet.', aja: 'じゅういに なりたいです', e: '🐶' },
      { q: 'Why?', qja: 'どうして？', a: 'Because I like animals.', aja: 'どうぶつが すきだからです', e: '🐾' },
      { q: 'Where do you want to go?', qja: 'どこに いきたい？', a: 'I want to go to Italy.', aja: 'イタリアに いきたいです', e: '🍕' },
    ],
  },
  {
    id: 'past', g: 7, icon: '🏖️',
    title: 'したことを はなせる',
    cando: '週末や夏休みにしたこと・感想を、過去形で話せる（went / ate / saw, It was 〜.）',
    items: [
      { en: 'I went to the beach.', ja: 'うみに いきました', e: '🏖️', b: 'went' },
      { en: 'I ate ice cream.', ja: 'アイスクリームを たべました', e: '🍦', b: 'ate' },
      { en: 'I saw fireworks.', ja: 'はなびを 見ました', e: '🎆', b: 'saw' },
      { en: 'It was fun.', ja: 'たのしかったです', e: '😆', b: 'fun' },
      { en: 'It was delicious.', ja: 'おいしかったです', e: '😋', b: 'delicious' },
      { en: 'What did you do yesterday?', ja: 'きのうは なにを したの？', e: '📅', b: 'yesterday' },
      { en: 'How was it?', ja: 'どうだった？', e: '💬', b: 'was' },
    ],
    talk: [
      { q: 'What did you do last weekend?', qja: 'しゅうまつは なにを したの？', a: 'I went to the beach.', aja: 'うみに いったよ', e: '🏖️' },
      { q: 'How was it?', qja: 'どうだった？', a: 'It was fun!', aja: 'たのしかった！', e: '😆' },
      { q: 'What did you eat?', qja: 'なにを たべたの？', a: 'I ate ice cream.', aja: 'アイスクリームを たべたよ', e: '🍦' },
    ],
  },
  {
    id: 'speech', g: 7, icon: '🎤',
    title: 'じこしょうかいの スピーチが できる',
    cando: '名前・年齢・出身・好きなもの・得意なことをまとめて、英語で自己紹介のスピーチができる',
    items: [
      { en: 'Hello, everyone.', ja: 'みなさん、こんにちは', e: '🎤', b: 'everyone' },
      { en: 'My name is Sora.', ja: 'わたしの なまえは ソラです', e: '🙋', b: 'name' },
      { en: "I'm eleven years old.", ja: '11さいです', e: '🎂', b: 'eleven' },
      { en: "I'm from Japan.", ja: 'にほんから きました', e: '🗾', b: 'from' },
      { en: 'My favorite food is sushi.', ja: 'すきな たべものは すしです', e: '🍣', b: 'favorite' },
      { en: "I'm good at drawing.", ja: 'えを かくのが とくいです', e: '🎨', b: 'good' },
      { en: 'Thank you for listening.', ja: 'きいてくれて ありがとう', e: '👏', b: 'listening' },
    ],
    talk: [
      { q: 'Where are you from?', qja: 'どこの しゅっしん？', a: "I'm from Japan.", aja: 'にほんです', e: '🗾' },
      { q: "What's your favorite food?", qja: 'すきな たべものは なに？', a: 'My favorite food is sushi.', aja: 'すきな たべものは すしです', e: '🍣' },
      { q: 'What are you good at?', qja: 'なにが とくい？', a: "I'm good at drawing.", aja: 'えを かくのが とくいです', e: '🎨' },
    ],
  },
];

// 学年ごとの スタート ステップ（0から数える）
window.CONV_START = [0, 0, 0, 0, 0, 1, 3, 5, 7];
