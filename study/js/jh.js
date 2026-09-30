/* =========================================================
   中学英語（中1〜中3）の データ
   g: 9=中1, 10=中2, 11=中3
   grammar: 文法の あなうめ { s: ___ を ふくむ文, a: 正解, d: まちがい, ja: 意味 }
   ========================================================= */
window.JH = (function () {
  const G = (g, s, a, d, ja) => ({ g, s, a, d, ja });
  const grammar = [
    // ---- 中1：be動詞・一般動詞・三単現・進行形・過去形・can・命令文・疑問詞 ----
    G(9, 'I ___ a student.', 'am', ['is', 'are', 'be'], 'わたしは生徒です。'),
    G(9, 'They ___ my friends.', 'are', ['is', 'am', 'be'], 'かれらはわたしの友だちです。'),
    G(9, 'She ___ tennis every day.', 'plays', ['play', 'playing', 'to play'], '彼女は毎日テニスをします。'),
    G(9, '___ you like music?', 'Do', ['Does', 'Are', 'Is'], 'あなたは音楽が好きですか。'),
    G(9, '___ he live in Osaka?', 'Does', ['Do', 'Is', 'Are'], '彼は大阪に住んでいますか。'),
    G(9, 'I ___ not like carrots.', 'do', ['does', 'am', 'is'], 'わたしはにんじんが好きではありません。'),
    G(9, 'My mother ___ breakfast every morning.', 'makes', ['make', 'making', 'to make'], '母は毎朝朝食を作ります。'),
    G(9, 'He is ___ a book now.', 'reading', ['read', 'reads', 'to read'], '彼は今、本を読んでいます。'),
    G(9, 'What are you ___ now?', 'doing', ['do', 'does', 'did'], 'あなたは今、何をしていますか。'),
    G(9, 'I ___ to the zoo yesterday.', 'went', ['go', 'goes', 'going'], 'わたしはきのう動物園に行きました。'),
    G(9, 'We ___ soccer last Sunday.', 'played', ['play', 'plays', 'playing'], 'わたしたちはこの前の日曜日にサッカーをしました。'),
    G(9, 'Did you ___ the movie?', 'see', ['saw', 'seen', 'sees'], 'あなたはその映画を見ましたか。'),
    G(9, 'This is ___ bag.', 'my', ['I', 'me', 'mine'], 'これはわたしのかばんです。'),
    G(9, 'I know ___ well.', 'him', ['he', 'his', 'they'], 'わたしは彼をよく知っています。'),
    G(9, '___ is that girl? — She is Emi.', 'Who', ['What', 'Where', 'When'], 'あの女の子はだれですか。— エミです。'),
    G(9, '___ do you go to school? — By bus.', 'How', ['What', 'Who', 'Which'], 'どうやって学校に行きますか。— バスで。'),
    G(9, 'I can ___ the guitar.', 'play', ['plays', 'playing', 'played'], 'わたしはギターをひくことができます。'),
    G(9, '___ your hands before lunch.', 'Wash', ['Washing', 'Washes', 'Washed'], '昼食の前に手を洗いなさい。'),
    G(9, 'How many books ___ you have?', 'do', ['does', 'are', 'is'], 'あなたは本を何冊持っていますか。'),
    G(9, '___ was the weather yesterday? — It was sunny.', 'How', ['What', 'Who', 'Which'], 'きのうの天気はどうでしたか。— 晴れでした。'),
    // ---- 中2：未来・there is・比較・不定詞・動名詞・助動詞・接続詞・過去進行形 ----
    G(10, 'I ___ visit Kyoto next week.', 'will', ['was', 'did', 'am'], 'わたしは来週、京都を訪れます。'),
    G(10, 'She is going ___ buy a new bike.', 'to', ['for', 'at', 'in'], '彼女は新しい自転車を買うつもりです。'),
    G(10, 'It ___ rain tomorrow.', 'will', ['is', 'does', 'was'], '明日は雨がふるでしょう。'),
    G(10, 'There ___ many people in the park.', 'are', ['is', 'am', 'be'], '公園にはたくさんの人がいます。'),
    G(10, 'There ___ a cat under the table.', 'is', ['are', 'am', 'be'], 'テーブルの下にねこが1ぴきいます。'),
    G(10, 'Tom is ___ than Ken.', 'taller', ['tall', 'tallest', 'more tall'], 'トムはケンより背が高い。'),
    G(10, 'This is the ___ mountain in Japan.', 'highest', ['high', 'higher', 'most high'], 'これは日本でいちばん高い山です。'),
    G(10, 'This book is ___ interesting than that one.', 'more', ['most', 'very', 'much'], 'この本はあの本よりおもしろい。'),
    G(10, 'I like summer the ___ of all seasons.', 'best', ['better', 'good', 'well'], 'すべての季節の中で夏がいちばん好きです。'),
    G(10, 'He is the tallest ___ the three.', 'of', ['in', 'than', 'at'], '彼は3人の中でいちばん背が高い。'),
    G(10, 'I want ___ a doctor.', 'to be', ['be', 'being', 'am'], 'わたしは医者になりたいです。'),
    G(10, 'I enjoyed ___ soccer with my friends.', 'playing', ['play', 'to play', 'played'], '友だちとサッカーをして楽しみました。'),
    G(10, 'I finished ___ my homework.', 'doing', ['do', 'to do', 'did'], 'わたしは宿題をし終えました。'),
    G(10, 'You ___ to get up early tomorrow.', 'have', ['must', 'should', 'can'], 'あなたは明日早く起きなければなりません。'),
    G(10, 'You ___ run in the classroom.', 'must not', ['must', "don't have to", 'have to'], '教室で走ってはいけません。'),
    G(10, 'I went to the library ___ read books.', 'to', ['for', 'at', 'by'], 'わたしは本を読むために図書館へ行きました。'),
    G(10, 'I was ___ TV when he called me.', 'watching', ['watch', 'watched', 'watches'], '彼が電話してきたとき、わたしはテレビを見ていました。'),
    G(10, '___ it is sunny tomorrow, let\'s go hiking.', 'If', ['Because', 'But', 'So'], 'もし明日晴れたら、ハイキングに行こう。'),
    G(10, 'I stayed home ___ I had a cold.', 'because', ['if', 'but', 'so'], 'かぜをひいていたので、わたしは家にいました。'),
    G(10, 'Can you show me how ___ use this?', 'to', ['for', 'of', 'at'], 'これの使い方を教えてくれますか。'),
    G(10, 'He gave ___ a present.', 'me', ['I', 'my', 'mine'], '彼はわたしにプレゼントをくれました。'),
    G(10, 'Shall I ___ the window? — Yes, please.', 'open', ['opens', 'opened', 'opening'], '窓を開けましょうか。— はい、お願いします。'),
    // ---- 中3：現在完了・受け身・関係代名詞・分詞・間接疑問・不定詞の応用・仮定法 ----
    G(11, 'I have ___ in Tokyo for five years.', 'lived', ['live', 'living', 'lives'], 'わたしは5年間東京に住んでいます。'),
    G(11, 'Have you ever ___ to Okinawa?', 'been', ['went', 'go', 'going'], 'あなたは沖縄に行ったことがありますか。'),
    G(11, 'I have ___ finished my homework.', 'already', ['yet', 'ever', 'since'], 'わたしはもう宿題を終えました。'),
    G(11, 'I have known him ___ 2020.', 'since', ['for', 'ago', 'during'], 'わたしは2020年から彼を知っています。'),
    G(11, 'I have been ___ for two hours.', 'studying', ['study', 'studies', 'to study'], 'わたしは2時間ずっと勉強しています。'),
    G(11, 'This temple ___ built 300 years ago.', 'was', ['is', 'has', 'were'], 'この寺は300年前に建てられました。'),
    G(11, 'English is ___ in many countries.', 'spoken', ['speak', 'spoke', 'speaking'], '英語は多くの国で話されています。'),
    G(11, 'The letter ___ by Mary was long.', 'written', ['wrote', 'writes', 'writing'], 'メアリーによって書かれた手紙は長かった。'),
    G(11, 'The boy ___ is running there is my brother.', 'who', ['which', 'what', 'where'], 'あそこで走っている男の子はわたしの弟です。'),
    G(11, 'This is the book ___ I bought yesterday.', 'which', ['who', 'what', 'where'], 'これはわたしがきのう買った本です。'),
    G(11, 'The girl ___ with Ken is Yumi.', 'talking', ['talks', 'talked', 'to talk'], 'ケンと話している女の子はユミです。'),
    G(11, 'Look at the ___ window.', 'broken', ['break', 'broke', 'breaking'], 'われた窓を見て。'),
    G(11, 'Do you know where ___ ?', 'he lives', ['does he live', 'he live', 'lives he'], '彼がどこに住んでいるか知っていますか。'),
    G(11, 'It is important ___ study every day.', 'to', ['for', 'of', 'that'], '毎日勉強することは大切です。'),
    G(11, 'It is too hot ___ play outside.', 'to', ['for', 'that', 'so'], '外で遊ぶには暑すぎます。'),
    G(11, 'I want you ___ help me.', 'to', ['for', 'that', 'of'], 'わたしはあなたに手伝ってほしいです。'),
    G(11, 'My mother made me ___ my room.', 'clean', ['to clean', 'cleaning', 'cleaned'], '母はわたしに部屋をそうじさせました。'),
    G(11, 'This song makes me ___.', 'happy', ['happily', 'happiness', 'to happy'], 'この歌はわたしを幸せな気持ちにします。'),
    G(11, 'If I ___ a bird, I could fly.', 'were', ['am', 'is', 'be'], 'もしわたしが鳥なら、飛べるのに。'),
    G(11, 'I wish I ___ speak French.', 'could', ['can', 'will', 'am'], 'フランス語が話せたらいいのに。'),
  ];

  // ---- 中学の 単語（g: 9=中1, 10=中2, 11=中3） ----
  const W = (g, en, ja) => ({ cat: 'jh', g, en, ja, emoji: '' });
  const words = [
    W(9, 'weekend', '週末'), W(9, 'breakfast', '朝食'), W(9, 'dinner', '夕食'), W(9, 'busy', '忙しい'),
    W(9, 'famous', '有名な'), W(9, 'beautiful', '美しい'), W(9, 'difficult', '難しい'), W(9, 'easy', '簡単な'),
    W(9, 'favorite', 'お気に入りの'), W(9, 'always', 'いつも'), W(9, 'usually', 'たいてい'), W(9, 'sometimes', 'ときどき'),
    W(9, 'often', 'よく・しばしば'), W(9, 'tomorrow', '明日'), W(9, 'yesterday', 'きのう'), W(9, 'answer', '答える'),
    W(9, 'visit', '訪れる'), W(9, 'practice', '練習する'), W(9, 'borrow', '借りる'), W(9, 'wait', '待つ'),
    W(9, 'begin', '始める'), W(9, 'arrive', '到着する'), W(9, 'country', '国'), W(9, 'language', '言語'),
    W(9, 'museum', '博物館'), W(9, 'festival', '祭り'), W(9, 'uncle', 'おじ'), W(9, 'aunt', 'おば'),
    W(10, 'remember', '覚えている'), W(10, 'forget', '忘れる'), W(10, 'decide', '決める'), W(10, 'believe', '信じる'),
    W(10, 'invent', '発明する'), W(10, 'understand', '理解する'), W(10, 'important', '大切な'), W(10, 'dangerous', '危険な'),
    W(10, 'popular', '人気のある'), W(10, 'different', '異なる'), W(10, 'necessary', '必要な'), W(10, 'useful', '役に立つ'),
    W(10, 'culture', '文化'), W(10, 'history', '歴史'), W(10, 'future', '未来'), W(10, 'environment', '環境'),
    W(10, 'experience', '経験'), W(10, 'volunteer', 'ボランティア'), W(10, 'message', '伝言'), W(10, 'information', '情報'),
    W(10, 'carefully', '注意深く'), W(10, 'finally', 'ついに'), W(10, 'suddenly', '突然'), W(10, 'abroad', '海外へ'),
    W(11, 'technology', '科学技術'), W(11, 'society', '社会'), W(11, 'peace', '平和'), W(11, 'war', '戦争'),
    W(11, 'energy', 'エネルギー'), W(11, 'pollution', '汚染'), W(11, 'solve', '解決する'), W(11, 'protect', '守る'),
    W(11, 'reduce', '減らす'), W(11, 'improve', '向上させる'), W(11, 'communicate', '意思を伝え合う'), W(11, 'express', '表現する'),
    W(11, 'respect', '尊敬する'), W(11, 'develop', '発達させる'), W(11, 'discover', '発見する'), W(11, 'although', '〜だけれども'),
    W(11, 'however', 'しかしながら'), W(11, 'instead', '代わりに'), W(11, 'especially', '特に'), W(11, 'probably', 'たぶん'),
    W(11, 'recently', '最近'), W(11, 'whole', '全体の'), W(11, 'foreign', '外国の'), W(11, 'several', 'いくつかの'),
  ];
  // 小学校の 単語リストに 足す
  if (window.STUDY_DATA) window.STUDY_DATA.words.push(...words);

  return { grammar, words };
})();
