/* =========================================================
   学習データ（英語の単語・フレーズ）
   g = 出題を始める学年（0=年少, 1=年中, 2=年長, 3=小1 … 8=小6）
   ========================================================= */
window.STUDY_DATA = (function () {
  // ---- 英単語（絵つき） ----
  const W = (cat, g, en, ja, emoji) => ({ cat, g, en, ja, emoji });
  const words = [
    // どうぶつ
    W('animal', 0, 'dog', 'いぬ', '🐶'),
    W('animal', 0, 'cat', 'ねこ', '🐱'),
    W('animal', 0, 'rabbit', 'うさぎ', '🐰'),
    W('animal', 0, 'elephant', 'ぞう', '🐘'),
    W('animal', 0, 'lion', 'ライオン', '🦁'),
    W('animal', 0, 'bear', 'くま', '🐻'),
    W('animal', 0, 'fish', 'さかな', '🐟'),
    W('animal', 0, 'bird', 'とり', '🐦'),
    W('animal', 1, 'monkey', 'さる', '🐵'),
    W('animal', 1, 'pig', 'ぶた', '🐷'),
    W('animal', 1, 'cow', 'うし', '🐮'),
    W('animal', 1, 'horse', 'うま', '🐴'),
    W('animal', 1, 'frog', 'かえる', '🐸'),
    W('animal', 1, 'panda', 'パンダ', '🐼'),
    W('animal', 2, 'tiger', 'とら', '🐯'),
    W('animal', 2, 'giraffe', 'キリン', '🦒'),
    W('animal', 2, 'penguin', 'ペンギン', '🐧'),
    W('animal', 2, 'mouse', 'ねずみ', '🐭'),
    W('animal', 2, 'turtle', 'かめ', '🐢'),
    W('animal', 3, 'snake', 'へび', '🐍'),
    W('animal', 3, 'whale', 'くじら', '🐳'),
    W('animal', 3, 'octopus', 'たこ', '🐙'),
    W('animal', 3, 'chicken', 'にわとり', '🐔'),
    W('animal', 3, 'sheep', 'ひつじ', '🐑'),
    W('animal', 4, 'fox', 'きつね', '🦊'),
    W('animal', 4, 'koala', 'コアラ', '🐨'),
    W('animal', 4, 'dolphin', 'イルカ', '🐬'),
    // くだもの
    W('fruit', 0, 'apple', 'りんご', '🍎'),
    W('fruit', 0, 'banana', 'バナナ', '🍌'),
    W('fruit', 0, 'strawberry', 'いちご', '🍓'),
    W('fruit', 1, 'orange', 'オレンジ', '🍊'),
    W('fruit', 1, 'grapes', 'ぶどう', '🍇'),
    W('fruit', 1, 'melon', 'メロン', '🍈'),
    W('fruit', 2, 'peach', 'もも', '🍑'),
    W('fruit', 2, 'lemon', 'レモン', '🍋'),
    W('fruit', 2, 'cherry', 'さくらんぼ', '🍒'),
    W('fruit', 3, 'watermelon', 'すいか', '🍉'),
    W('fruit', 3, 'pineapple', 'パイナップル', '🍍'),
    W('fruit', 4, 'kiwi fruit', 'キウイ', '🥝'),
    // たべもの・のみもの
    W('food', 1, 'bread', 'パン', '🍞'),
    W('food', 1, 'egg', 'たまご', '🥚'),
    W('food', 1, 'milk', 'ぎゅうにゅう', '🥛'),
    W('food', 1, 'cake', 'ケーキ', '🍰'),
    W('food', 2, 'rice', 'ごはん', '🍚'),
    W('food', 2, 'pizza', 'ピザ', '🍕'),
    W('food', 2, 'ice cream', 'アイスクリーム', '🍦'),
    W('food', 2, 'carrot', 'にんじん', '🥕'),
    W('food', 2, 'tomato', 'トマト', '🍅'),
    W('food', 3, 'hamburger', 'ハンバーガー', '🍔'),
    W('food', 3, 'potato', 'じゃがいも', '🥔'),
    W('food', 3, 'corn', 'とうもろこし', '🌽'),
    W('food', 3, 'juice', 'ジュース', '🧃'),
    W('food', 3, 'donut', 'ドーナツ', '🍩'),
    W('food', 4, 'cookie', 'クッキー', '🍪'),
    W('food', 4, 'onion', 'たまねぎ', '🧅'),
    W('food', 4, 'sandwich', 'サンドイッチ', '🥪'),
    W('food', 5, 'spaghetti', 'スパゲッティ', '🍝'),
    W('food', 5, 'curry and rice', 'カレーライス', '🍛'),
    W('food', 5, 'salad', 'サラダ', '🥗'),
    // のりもの
    W('vehicle', 0, 'car', 'くるま', '🚗'),
    W('vehicle', 0, 'bus', 'バス', '🚌'),
    W('vehicle', 1, 'train', 'でんしゃ', '🚃'),
    W('vehicle', 1, 'airplane', 'ひこうき', '✈️'),
    W('vehicle', 1, 'ship', 'ふね', '🚢'),
    W('vehicle', 2, 'bike', 'じてんしゃ', '🚲'),
    W('vehicle', 2, 'taxi', 'タクシー', '🚕'),
    W('vehicle', 3, 'rocket', 'ロケット', '🚀'),
    W('vehicle', 3, 'truck', 'トラック', '🚚'),
    W('vehicle', 4, 'helicopter', 'ヘリコプター', '🚁'),
    // からだ
    W('body', 1, 'eye', 'め', '👁️'),
    W('body', 1, 'ear', 'みみ', '👂'),
    W('body', 1, 'nose', 'はな', '👃'),
    W('body', 1, 'mouth', 'くち', '👄'),
    W('body', 2, 'hand', 'て', '✋'),
    W('body', 2, 'foot', 'あし', '🦶'),
    // しぜん・てんき
    W('nature', 1, 'sun', 'たいよう', '☀️'),
    W('nature', 1, 'moon', 'つき', '🌙'),
    W('nature', 1, 'star', 'ほし', '⭐'),
    W('nature', 2, 'flower', 'はな', '🌸'),
    W('nature', 2, 'tree', 'き', '🌳'),
    W('nature', 2, 'rainbow', 'にじ', '🌈'),
    W('nature', 3, 'cloud', 'くも', '☁️'),
    W('nature', 3, 'snow', 'ゆき', '❄️'),
    W('nature', 4, 'mountain', 'やま', '⛰️'),
    W('weather', 3, 'sunny', 'はれ', '☀️'),
    W('weather', 3, 'rainy', 'あめ', '☔'),
    W('weather', 3, 'cloudy', 'くもり', '☁️'),
    W('weather', 4, 'snowy', 'ゆき', '⛄'),
    // もの
    W('thing', 1, 'ball', 'ボール', '⚽'),
    W('thing', 1, 'book', 'ほん', '📕'),
    W('thing', 2, 'cap', 'ぼうし', '🧢'),
    W('thing', 2, 'shoes', 'くつ', '👟'),
    W('thing', 2, 'bag', 'かばん', '🎒'),
    W('thing', 3, 'pencil', 'えんぴつ', '✏️'),
    W('thing', 3, 'pen', 'ペン', '🖊️'),
    W('thing', 3, 'umbrella', 'かさ', '☂️'),
    W('thing', 3, 'clock', 'とけい', '🕐'),
    W('thing', 3, 'house', 'いえ', '🏠'),
    W('thing', 4, 'notebook', 'ノート', '📓'),
    W('thing', 4, 'ruler', 'じょうぎ', '📏'),
    W('thing', 4, 'scissors', 'はさみ', '✂️'),
    W('thing', 4, 'key', 'かぎ', '🔑'),
    W('thing', 4, 'chair', 'いす', '🪑'),
    W('thing', 5, 'glasses', 'めがね', '👓'),
    W('thing', 5, 'computer', 'コンピューター', '💻'),
    W('thing', 5, 'piano', 'ピアノ', '🎹'),
    W('thing', 5, 'guitar', 'ギター', '🎸'),
    // きもち
    W('feeling', 2, 'happy', 'うれしい', '😊'),
    W('feeling', 2, 'sad', 'かなしい', '😢'),
    W('feeling', 3, 'angry', 'おこっている', '😠'),
    W('feeling', 3, 'sleepy', 'ねむい', '😪'),
    W('feeling', 4, 'tired', 'つかれた', '😫'),
    W('feeling', 4, 'hungry', 'おなかが すいた', '🤤'),
    // かぞく
    W('family', 3, 'father', 'おとうさん', '👨'),
    W('family', 3, 'mother', 'おかあさん', '👩'),
    W('family', 3, 'baby', 'あかちゃん', '👶'),
    W('family', 4, 'grandfather', 'おじいさん', '👴'),
    W('family', 4, 'grandmother', 'おばあさん', '👵'),
    W('family', 4, 'brother', 'きょうだい（兄・弟）', '👦'),
    W('family', 4, 'sister', 'しまい（姉・妹）', '👧'),
    // スポーツ
    W('sport', 4, 'soccer', 'サッカー', '⚽'),
    W('sport', 4, 'baseball', 'やきゅう', '⚾'),
    W('sport', 4, 'basketball', 'バスケットボール', '🏀'),
    W('sport', 4, 'tennis', 'テニス', '🎾'),
    W('sport', 5, 'swimming', 'すいえい', '🏊'),
    W('sport', 5, 'volleyball', 'バレーボール', '🏐'),
    W('sport', 5, 'table tennis', 'たっきゅう', '🏓'),
    // うごき
    W('verb', 4, 'run', 'はしる', '🏃'),
    W('verb', 4, 'swim', 'およぐ', '🏊'),
    W('verb', 4, 'eat', 'たべる', '🍽️'),
    W('verb', 4, 'sing', 'うたう', '🎤'),
    W('verb', 4, 'sleep', 'ねる', '😴'),
    W('verb', 5, 'dance', 'おどる', '💃'),
    W('verb', 5, 'read', 'よむ', '📖'),
    W('verb', 5, 'write', 'かく', '✍️'),
    W('verb', 5, 'walk', 'あるく', '🚶'),
    W('verb', 5, 'cook', 'りょうりする', '🍳'),
    W('verb', 6, 'study', 'べんきょうする', '📚'),
    W('verb', 6, 'drink', 'のむ', '🥤'),
    // しょくぎょう
    W('job', 6, 'teacher', 'せんせい', '🧑‍🏫'),
    W('job', 6, 'doctor', 'いしゃ', '🧑‍⚕️'),
    W('job', 6, 'cook', 'コック', '🧑‍🍳'),
    W('job', 6, 'police officer', 'けいさつかん', '👮'),
    W('job', 7, 'firefighter', 'しょうぼうし', '🧑‍🚒'),
    W('job', 7, 'farmer', 'のうか', '🧑‍🌾'),
    W('job', 7, 'pilot', 'パイロット', '🧑‍✈️'),
    W('job', 7, 'singer', 'かしゅ', '🎤'),
    W('job', 8, 'scientist', 'かがくしゃ', '🧑‍🔬'),
    W('job', 8, 'astronaut', 'うちゅうひこうし', '🧑‍🚀'),
    // ばしょ
    W('place', 5, 'school', 'がっこう', '🏫'),
    W('place', 5, 'park', 'こうえん', '🏞️'),
    W('place', 5, 'hospital', 'びょういん', '🏥'),
    W('place', 5, 'station', 'えき', '🚉'),
    W('place', 6, 'library', 'としょかん', '📚'),
    W('place', 6, 'zoo', 'どうぶつえん', '🦓'),
    W('place', 6, 'restaurant', 'レストラン', '🍽️'),
    W('place', 7, 'post office', 'ゆうびんきょく', '🏤'),
    W('place', 7, 'supermarket', 'スーパー', '🛒'),
    W('place', 7, 'bank', 'ぎんこう', '🏦'),
  ];

  // ---- いろ ----
  const colors = [
    { g: 0, en: 'red', ja: 'あか', hex: '#e53935' },
    { g: 0, en: 'blue', ja: 'あお', hex: '#1e88e5' },
    { g: 0, en: 'yellow', ja: 'きいろ', hex: '#fdd835' },
    { g: 0, en: 'green', ja: 'みどり', hex: '#43a047' },
    { g: 1, en: 'pink', ja: 'ピンク', hex: '#f48fb1' },
    { g: 1, en: 'black', ja: 'くろ', hex: '#212121' },
    { g: 1, en: 'white', ja: 'しろ', hex: '#ffffff' },
    { g: 2, en: 'orange', ja: 'オレンジ', hex: '#fb8c00' },
    { g: 2, en: 'purple', ja: 'むらさき', hex: '#8e24aa' },
    { g: 3, en: 'brown', ja: 'ちゃいろ', hex: '#795548' },
  ];

  // ---- かたち ----
  const shapes = [
    { g: 0, en: 'circle', ja: 'まる', sym: '●' },
    { g: 0, en: 'triangle', ja: 'さんかく', sym: '▲' },
    { g: 0, en: 'square', ja: 'しかく', sym: '■' },
    { g: 1, en: 'star', ja: 'ほし', sym: '★' },
    { g: 1, en: 'heart', ja: 'ハート', sym: '♥' },
  ];

  // ---- かず ----
  const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const tens = { 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred' };
  function numberWord(n) {
    if (n <= 20) return numbers[n];
    if (tens[n]) return tens[n];
    const t = Math.floor(n / 10) * 10, o = n % 10;
    const tw = t === 20 ? 'twenty' : tens[t];
    return tw + '-' + numbers[o];
  }

  // ---- ようび・つき・じゅんばん ----
  const days = [
    { en: 'Sunday', ja: 'にちようび' }, { en: 'Monday', ja: 'げつようび' }, { en: 'Tuesday', ja: 'かようび' },
    { en: 'Wednesday', ja: 'すいようび' }, { en: 'Thursday', ja: 'もくようび' }, { en: 'Friday', ja: 'きんようび' },
    { en: 'Saturday', ja: 'どようび' },
  ];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
    'ninth', 'tenth', 'eleventh', 'twelfth'];

  // ---- あいさつ ----
  const greetings = [
    { g: 3, en: 'Hello.', ja: 'こんにちは' },
    { g: 3, en: 'Good morning.', ja: 'おはよう' },
    { g: 3, en: 'Good night.', ja: 'おやすみ' },
    { g: 3, en: 'Thank you.', ja: 'ありがとう' },
    { g: 3, en: 'Goodbye.', ja: 'さようなら' },
    { g: 4, en: "I'm sorry.", ja: 'ごめんなさい' },
    { g: 4, en: 'See you.', ja: 'またね' },
    { g: 4, en: 'Nice to meet you.', ja: 'はじめまして' },
    { g: 5, en: "You're welcome.", ja: 'どういたしまして' },
    { g: 5, en: 'Excuse me.', ja: 'すみません' },
  ];

  // ---- しつもん と こたえ ----
  const qa = [
    { g: 5, q: 'How are you?', a: "I'm fine, thank you." },
    { g: 5, q: "What's your name?", a: 'My name is Ken.' },
    { g: 5, q: 'How old are you?', a: "I'm ten." },
    { g: 5, q: "What's this?", a: "It's a pencil." },
    { g: 5, q: 'What color do you like?', a: 'I like blue.' },
    { g: 5, q: 'Do you like dogs?', a: 'Yes, I do.' },
    { g: 6, q: 'How many apples?', a: 'Three apples.' },
    { g: 6, q: 'What time is it?', a: "It's seven o'clock." },
    { g: 6, q: 'What day is it today?', a: "It's Monday." },
    { g: 6, q: 'What do you want?', a: 'I want a red cap.' },
    { g: 7, q: 'When is your birthday?', a: 'My birthday is May 5th.' },
    { g: 7, q: 'Can you swim?', a: 'Yes, I can.' },
    { g: 7, q: 'Where is the cat?', a: "It's under the table." },
    { g: 7, q: 'What would you like?', a: "I'd like pizza, please." },
    { g: 7, q: 'How much is it?', a: "It's 200 yen." },
    { g: 8, q: 'What do you want to be?', a: 'I want to be a doctor.' },
    { g: 8, q: 'Where do you want to go?', a: 'I want to go to Italy.' },
    { g: 8, q: 'What did you do last Sunday?', a: 'I went to the park.' },
    { g: 8, q: 'Where do you live?', a: 'I live in Osaka.' },
    { g: 8, q: 'How was your summer vacation?', a: 'It was fun.' },
  ];

  // ---- ぶんの いみ ----
  const sentences = [
    { g: 6, en: 'I like cats.', ja: 'わたしは ねこが すきです。' },
    { g: 6, en: 'I have a dog.', ja: 'わたしは 犬を かっています。' },
    { g: 6, en: "I don't like tomatoes.", ja: 'わたしは トマトが すきでは ありません。' },
    { g: 6, en: "Let's play soccer.", ja: 'サッカーを しよう。' },
    { g: 6, en: 'This is my father.', ja: 'こちらは わたしの 父です。' },
    { g: 7, en: 'I can play the piano.', ja: 'わたしは ピアノが ひけます。' },
    { g: 7, en: 'He can run fast.', ja: 'かれは はやく はしれます。' },
    { g: 7, en: 'I get up at six.', ja: 'わたしは 6時に おきます。' },
    { g: 7, en: 'She is my sister.', ja: 'かのじょは わたしの 姉（妹）です。' },
    { g: 7, en: 'I usually walk to school.', ja: 'わたしは ふだん 歩いて 学校へ 行きます。' },
    { g: 8, en: 'I want to go to France.', ja: 'わたしは フランスに 行きたいです。' },
    { g: 8, en: 'I went to the zoo.', ja: 'わたしは どうぶつえんに 行きました。' },
    { g: 8, en: 'I ate ice cream.', ja: 'わたしは アイスクリームを 食べました。' },
    { g: 8, en: 'It was fun.', ja: 'それは たのしかったです。' },
    { g: 8, en: 'I want to be a teacher.', ja: 'わたしは 先生に なりたいです。' },
    { g: 8, en: 'I saw a big fish.', ja: 'わたしは 大きな 魚を 見ました。' },
  ];

  // ---- 過去形 ----
  const past = [
    ['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['play', 'played'], ['have', 'had'],
    ['enjoy', 'enjoyed'], ['watch', 'watched'], ['swim', 'swam'], ['run', 'ran'],
    ['make', 'made'], ['buy', 'bought'], ['get', 'got'], ['visit', 'visited'], ['sing', 'sang'],
  ];

  // ---- 国 ----
  const countries = [
    { en: 'Japan', ja: 'にほん' }, { en: 'America', ja: 'アメリカ' }, { en: 'China', ja: 'ちゅうごく' },
    { en: 'Korea', ja: 'かんこく' }, { en: 'France', ja: 'フランス' }, { en: 'Italy', ja: 'イタリア' },
    { en: 'Australia', ja: 'オーストラリア' }, { en: 'Brazil', ja: 'ブラジル' }, { en: 'India', ja: 'インド' },
    { en: 'Canada', ja: 'カナダ' }, { en: 'the UK', ja: 'イギリス' }, { en: 'Egypt', ja: 'エジプト' },
  ];

  // ---- 教科 ----
  const subjects = [
    { en: 'Japanese', ja: 'こくご' }, { en: 'math', ja: 'さんすう' }, { en: 'science', ja: 'りか' },
    { en: 'social studies', ja: 'しゃかい' }, { en: 'English', ja: 'えいご' }, { en: 'music', ja: 'おんがく' },
    { en: 'P.E.', ja: 'たいいく' }, { en: 'arts and crafts', ja: 'ずこう' }, { en: 'home economics', ja: 'かていか' },
  ];

  return { words, colors, shapes, numbers, numberWord, days, months, ordinals, greetings, qa, sentences, past, countries, subjects };
})();
