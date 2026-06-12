// Generates large graded banks of IELTS Writing practice topics (Task 1 Academic,
// Task 1 General, Task 2 Essay) and merges them into src/assets/topics.json.
//
// Question stems are modelled on real reported exam questions and official task
// types compiled from free, reputable sources:
//   - ielts.org sample test questions
//   - takeielts.britishcouncil.org free practice tests
//   - Cambridge IELTS practice test series (task types)
//   - ieltsliz.com, ieltsbuddy.com, howtodoielts.com, ieltspodcast.com,
//     ieltsmaterial.com, writing9.com, simplyielts.com (reported questions)
//
// Idempotent: previously generated topics (ids containing "-gen-") are replaced.
// Run: node scripts/generate-writing-topics.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'assets', 'topics.json');

const LEVEL = {
  e: 'Beginner to Intermediate',
  m: 'Intermediate to Advanced',
  h: 'Advanced',
};

const SOURCE =
  'Generated from real-exam question patterns — ielts.org, British Council, Cambridge IELTS task types; reported questions via ieltsliz.com, ieltsbuddy.com, howtodoielts.com, ieltspodcast.com, writing9.com';

// ─────────────────────────────────────────────────────────────────────────────
// Task 2 Essay
// ─────────────────────────────────────────────────────────────────────────────

const T2_AGREE = [
  ['Schools should teach practical life skills such as cooking and managing money alongside academic subjects', 'Education', 'e'],
  ['Children should start learning a foreign language at primary school', 'Education', 'e'],
  ['Homework should be abolished for primary school children', 'Education', 'e'],
  ['All children should learn to play a musical instrument at school', 'Education', 'e'],
  ['Physical education should be compulsory throughout secondary school', 'Education', 'e'],
  ['School uniforms help create a sense of equality among students', 'Education', 'e'],
  ['University students should pay the full cost of their studies', 'Education', 'm'],
  ['Academic subjects such as history and philosophy are less useful than practical subjects', 'Education', 'm'],
  ['Teachers can never be fully replaced by technology in the classroom', 'Education', 'm'],
  ['Examinations are a poor way to measure a student’s true ability', 'Education', 'm'],
  ['Single-sex schools provide a better learning environment than mixed schools', 'Education', 'h'],
  ['Schools should select students by academic ability rather than teaching mixed-ability classes', 'Education', 'h'],
  ['Competition in the classroom does more harm than good', 'Education', 'h'],
  ['People rely too much on their smartphones in everyday life', 'Technology', 'e'],
  ['Children under twelve should not be allowed to own a smartphone', 'Technology', 'e'],
  ['Video games are a harmless form of entertainment for children', 'Technology', 'e'],
  ['Printed newspapers will disappear within the next twenty years', 'Media', 'm'],
  ['The internet has made people less patient than previous generations', 'Technology', 'm'],
  ['Technology has made our lives more complicated rather than simpler', 'Technology', 'm'],
  ['Social media companies should be responsible for the content published on their platforms', 'Technology', 'h'],
  ['Governments should regulate the use of artificial intelligence in the workplace', 'Technology', 'h'],
  ['Online privacy is more important than national security', 'Technology', 'h'],
  ['Space exploration is a waste of public money', 'Technology', 'h'],
  ['Plastic packaging should be banned for all food products', 'Environment', 'e'],
  ['Everyone should take personal responsibility for reducing the waste they produce', 'Environment', 'e'],
  ['Individuals can do little to protect the environment compared with governments and large companies', 'Environment', 'm'],
  ['Zoos do more harm than good and should be closed', 'Environment', 'm'],
  ['Air travel should be made more expensive to protect the environment', 'Environment', 'h'],
  ['Wealthy countries should bear most of the cost of fighting climate change', 'Environment', 'h'],
  ['Economic growth should be sacrificed when it conflicts with protecting the environment', 'Environment', 'h'],
  ['Governments should tax unhealthy foods to improve public health', 'Health', 'm'],
  ['Prevention is better than cure, so governments should spend more on health education than on hospitals', 'Health', 'm'],
  ['Mental health should be treated with the same importance as physical health', 'Health', 'm'],
  ['Hospitals and clinics should be run by governments rather than private companies', 'Health', 'h'],
  ['Professional sports people earn too much money', 'Work and Lifestyle', 'e'],
  ['Job satisfaction is more important than a high salary', 'Work and Lifestyle', 'e'],
  ['Working from home benefits employees far more than employers', 'Work and Lifestyle', 'm'],
  ['Employees should be paid according to their performance rather than a fixed salary', 'Work and Lifestyle', 'm'],
  ['Everyone should retire at the same fixed age regardless of their profession', 'Work and Lifestyle', 'h'],
  ['Unpaid internships exploit young people and should be banned', 'Work and Lifestyle', 'h'],
  ['Museums and art galleries should be free for everyone', 'Culture', 'e'],
  ['Traditional festivals and customs are losing their importance', 'Culture', 'e'],
  ['Famous people have a responsibility to act as role models for young people', 'Society', 'e'],
  ['The legal driving age should be raised', 'Society', 'e'],
  ['Advertising aimed at children should be banned', 'Society', 'm'],
  ['Public money should not be spent on the arts when there are more urgent priorities', 'Culture', 'h'],
  ['Globalisation is causing the world’s cultures to become too similar', 'Culture', 'h'],
  ['Governments should provide free housing for everyone who cannot afford it', 'Government and Society', 'm'],
  ['Public transport should be free for all residents of large cities', 'Government and Society', 'm'],
  ['Governments should invest more in public transport than in building new roads', 'Government and Society', 'm'],
  ['Voting in national elections should be compulsory', 'Government and Society', 'h'],
  ['Rich countries should accept more economic migrants', 'Government and Society', 'h'],
  ['Foreign aid does more harm than good for developing countries', 'Government and Society', 'h'],
  ['People who commit minor crimes should do community service instead of going to prison', 'Crime', 'h'],
  ['The best way to reduce crime is to address its social causes rather than increase punishments', 'Crime', 'h'],
  ['CCTV cameras in public places do more to protect people than to invade their privacy', 'Crime', 'm'],
  ['Young offenders should be treated differently from adult criminals', 'Crime', 'm'],
  ['Keeping pets in small city apartments is unfair to the animals', 'Daily Life', 'e'],
  ['Cooking at home is becoming a lost skill', 'Daily Life', 'e'],
  ['People today care too much about their personal image', 'Society', 'm'],
  ['Children should be taught how to grow food at school', 'Education', 'e'],
  ['Watching television is a waste of time for children', 'Media', 'e'],
  ['Libraries are no longer necessary in the age of the internet', 'Culture', 'm'],
  ['Fast food restaurants should display health warnings like cigarette packets', 'Health', 'm'],
  ['It is the responsibility of schools to teach children about healthy lifestyles', 'Education', 'e'],
  ['Tourists should pay an extra tax to visit popular natural sites', 'Environment', 'm'],
  ['All new buildings should be required to include renewable energy systems', 'Environment', 'm'],
  ['Distance learning will eventually replace traditional universities', 'Education', 'h'],
  ['The growth of artificial intelligence threatens more jobs than it creates', 'Technology', 'h'],
  ['Newspapers and broadcasters should be legally required to present balanced views', 'Media', 'h'],
  ['Companies should be required to publish the salaries of all employees', 'Work and Lifestyle', 'h'],
  ['It is better for children to grow up with brothers and sisters than as an only child', 'Society', 'e'],
  ['Money spent on professional sport would be better spent on public sports facilities', 'Health', 'm'],
  ['People should be encouraged to repair products rather than replace them', 'Environment', 'e'],
  ['International travel makes people more tolerant of other cultures', 'Culture', 'm'],
  ['Governments should limit the amount of advertising in public spaces', 'Society', 'm'],
  ['School subjects should be chosen by students themselves from an early age', 'Education', 'm'],
  ['The most effective way to improve public health is to increase the number of sports facilities', 'Health', 'm'],
  ['Wild animals have no place in the twenty-first century, so protecting them is a waste of resources', 'Environment', 'h'],
  ['First impressions of a person are usually accurate', 'Society', 'e'],
  ['It is more important for a building to serve its purpose than to look beautiful', 'Culture', 'h'],
  ['Government surveillance of the internet is a necessary tool for public safety', 'Crime', 'h'],
  ['Children who start school at a very early age gain a lasting advantage', 'Education', 'h'],
  ['People place too much importance on owning a car', 'Daily Life', 'e'],
];

const T2_PROBLEM = [
  ['rapid population growth in large cities', 'Government and Society', 'm'],
  ['an ageing population', 'Government and Society', 'h'],
  ['a shortage of affordable housing', 'Government and Society', 'h'],
  ['heavy dependence on private cars', 'Environment', 'm'],
  ['the decline of town centres as shopping moves online', 'Society', 'm'],
  ['high youth unemployment', 'Work and Lifestyle', 'h'],
  ['overcrowded public transport at peak times', 'Society', 'e'],
  ['plastic pollution in rivers and oceans', 'Environment', 'e'],
  ['rising obesity rates among adults', 'Health', 'm'],
  ['a shortage of qualified nurses and doctors', 'Health', 'h'],
  ['increasing air pollution in urban areas', 'Environment', 'e'],
  ['too many tourists visiting the same famous destinations', 'Culture', 'm'],
  ['the disappearance of regional languages and dialects', 'Culture', 'h'],
  ['large amounts of electronic waste', 'Environment', 'm'],
  ['children spending too little time outdoors', 'Health', 'e'],
  ['the spread of false information online', 'Media', 'h'],
  ['water shortages in many regions', 'Environment', 'h'],
  ['noise pollution in residential areas', 'Society', 'e'],
  ['a growing shortage of teachers in state schools', 'Education', 'm'],
  ['traffic accidents involving young drivers', 'Society', 'm'],
  ['people working very long hours', 'Work and Lifestyle', 'm'],
  ['the loss of farmland to urban development', 'Environment', 'h'],
  ['increasing levels of household debt', 'Government and Society', 'h'],
  ['food being transported over very long distances before it is sold', 'Environment', 'm'],
];

const T2_FULL = [
  ['Some parents buy their children whatever they ask for. Why do they do this? Is it good or bad for the children?', 'Society', 'e'],
  ['More and more young people want to become famous. Why is this? Is fame a realistic goal for most people?', 'Society', 'e'],
  ['Many museums charge for admission while others are free. Do you think the advantages of charging outweigh the disadvantages?', 'Culture', 'm'],
  ['In some countries, owning a home rather than renting one is very important for people. Why might this be the case? Is it a positive or negative situation?', 'Society', 'm'],
  ['Some people say that music is a good way of bringing people of different cultures and ages together. To what extent do you agree or disagree?', 'Culture', 'e'],
  ['Many working people get little or no exercise during the working day. Why does this happen? What can be done about it?', 'Health', 'e'],
  ['Some people spend most of their lives living close to where they were born. What might be the reasons for this? What are the advantages and disadvantages?', 'Society', 'm'],
  ['It is often said that governments spend too much money on projects to protect wildlife while ignoring problems that affect people. To what extent do you agree?', 'Environment', 'h'],
  ['Crime rates are usually higher in urban areas than in rural areas. Why might this be? What can be done to reduce crime in cities?', 'Crime', 'h'],
  ['Some employers reward members of staff for exceptional performance with bonuses. Others believe a fair fixed salary is better. Discuss both views and give your opinion.', 'Work and Lifestyle', 'm'],
  ['Today people can shop, work and communicate without meeting anyone face to face. What problems can this cause? How can these problems be reduced?', 'Technology', 'm'],
  ['Some cities have few green spaces and high-rise buildings dominate the skyline. Why has this happened? Is it a positive or negative development?', 'Environment', 'm'],
  ['An increasing number of people do not know their neighbours. Why has this happened? What can be done to bring communities closer together?', 'Society', 'm'],
  ['Some people believe that children should be banned from using social media until they are sixteen. Others think such bans are impossible to enforce. Discuss both views and give your opinion.', 'Technology', 'h'],
  ['Universities should accept equal numbers of male and female students in every subject. To what extent do you agree or disagree?', 'Education', 'h'],
  ['Some people think that hosting refugees is the duty of every wealthy country. Others believe each country must put its own citizens first. Discuss both views and give your opinion.', 'Government and Society', 'h'],
  ['In many workplaces, older employees now work alongside colleagues from much younger generations. What challenges does this create? How can workplaces benefit from this situation?', 'Work and Lifestyle', 'h'],
  ['Some people argue that money spent exploring the oceans would bring more benefits than space research. To what extent do you agree or disagree?', 'Technology', 'h'],
  ['Children today play less with traditional toys and more with electronic devices. Why is this happening? Do the benefits outweigh the drawbacks?', 'Education', 'e'],
  ['Many people move to English-speaking countries to study at university. Why do they choose to do this? Do the benefits outweigh the difficulties?', 'Education', 'e'],
  ['Some people think advertising influences what people buy far more than they realise. Others say consumers make rational choices. Discuss both views and give your opinion.', 'Media', 'h'],
  ['Online reviews now strongly influence which products and services people choose. Is this a positive or negative development?', 'Technology', 'm'],
  ['Some governments encourage industries and businesses to move out of large cities and into regional areas. Do the advantages of this outweigh the disadvantages?', 'Government and Society', 'h'],
  ['It is sometimes said that people are naturally good and that society makes them behave badly. To what extent do you agree or disagree?', 'Society', 'h'],
  ['Many supermarkets sell more imported food than locally produced food. Why is this the case? Is this a positive or negative development?', 'Environment', 'm'],
  ['Some people prefer to plan every detail of their free time, while others prefer to do things spontaneously. Discuss both approaches and give your opinion.', 'Daily Life', 'e'],
  ['In many countries, the traditional skills of making things by hand are disappearing. Why is this happening? Should these skills be preserved?', 'Culture', 'm'],
  ['Some people change careers completely several times during their working lives. Why does this happen? Is it a positive or negative development?', 'Work and Lifestyle', 'm'],
];

const T2_DISCUSS = [
  ['children benefit most from growing up in the countryside', 'cities offer children better opportunities and experiences', 'Society', 'e'],
  ['young people should follow the career their parents recommend', 'young people should choose their own career path', 'Society', 'e'],
  ['watching films at the cinema is a better experience', 'streaming films at home is preferable', 'Culture', 'e'],
  ['team sports teach children more valuable life lessons', 'individual sports build stronger character', 'Health', 'e'],
  ['reading fiction is a valuable use of time', 'non-fiction teaches people more about the real world', 'Culture', 'e'],
  ['job satisfaction matters more than salary when choosing a career', 'financial security should always come first', 'Work and Lifestyle', 'e'],
  ['it is better to have a few close friends', 'having a wide circle of acquaintances is more beneficial', 'Society', 'e'],
  ['it is better to specialise in one field of study', 'a broad education across many subjects is more valuable', 'Education', 'm'],
  ['governments should prioritise spending on public transport', 'building more roads is a better use of public money', 'Government and Society', 'm'],
  ['history is one of the most important school subjects', 'science and technology deserve more attention in schools', 'Education', 'm'],
  ['children learn best through play and exploration', 'formal structured lessons produce better results', 'Education', 'm'],
  ['tourists should adapt to the customs of the country they visit', 'host countries should accommodate the habits of visitors', 'Culture', 'm'],
  ['it is better to rent a home and stay flexible', 'buying a home is a wiser long-term decision', 'Daily Life', 'm'],
  ['governments should fund the training of doctors and nurses', 'healthcare workers should pay for their own professional studies', 'Health', 'm'],
  ['online friendships can be as meaningful as face-to-face relationships', 'real friendship requires regular personal contact', 'Technology', 'm'],
  ['children should be rewarded for good behaviour', 'rewards teach children to expect something in return', 'Education', 'm'],
  ['it is better to work for a large company', 'small companies offer more valuable experience', 'Work and Lifestyle', 'm'],
  ['printed books are the best way to read', 'digital reading is more practical in the modern world', 'Culture', 'm'],
  ['success in life is mainly the result of hard work', 'luck and circumstances play the biggest role in success', 'Society', 'h'],
  ['the main purpose of education is to prepare people for employment', 'education should develop the whole person regardless of career', 'Education', 'h'],
  ['businesses exist primarily to make profits for their owners', 'businesses have wider responsibilities to society', 'Work and Lifestyle', 'h'],
  ['news and journalism should be free for everyone to access', 'quality journalism must be paid for to survive', 'Media', 'h'],
  ['old buildings should be preserved whatever the cost', 'cities must make way for modern development', 'Culture', 'h'],
  ['animals should not be used in scientific research', 'such research is necessary for medical progress', 'Health', 'h'],
  ['governments should spend money on space exploration', 'that money should be used to solve problems on Earth', 'Technology', 'h'],
  ['economic growth is the best way to end poverty', 'economic growth is damaging the environment and should be limited', 'Government and Society', 'h'],
  ['the death penalty is never acceptable in a modern justice system', 'it is justified for the most serious crimes', 'Crime', 'h'],
  ['artificial intelligence will create more jobs than it destroys', 'automation will lead to widespread unemployment', 'Technology', 'h'],
  ['international sporting events bring countries together', 'they are an expensive distraction from real problems', 'Society', 'h'],
  ['parents are the most important influence on a child’s development', 'friends and school shape children more strongly', 'Society', 'm'],
];

const T2_CAUSE = [
  ['more people are living alone than ever before', 'Society', 'm'],
  ['childhood obesity is increasing', 'Health', 'e'],
  ['young people are leaving rural areas to live in cities', 'Society', 'm'],
  ['people are getting married and having children later in life', 'Society', 'm'],
  ['birth rates are falling', 'Society', 'h'],
  ['the gap between rich and poor is widening', 'Government and Society', 'h'],
  ['many adults suffer from high levels of work-related stress', 'Health', 'm'],
  ['households throw away large amounts of food', 'Environment', 'e'],
  ['fewer young people are choosing to become teachers', 'Education', 'm'],
  ['traffic congestion in cities is getting worse', 'Environment', 'e'],
  ['elderly people increasingly experience loneliness', 'Society', 'm'],
  ['average screen time among teenagers keeps rising', 'Technology', 'e'],
  ['fewer people take part in local community activities', 'Society', 'm'],
  ['many graduates cannot find jobs that match their qualifications', 'Education', 'h'],
  ['small independent shops are closing in many towns', 'Work and Lifestyle', 'm'],
  ['people change jobs much more frequently than in the past', 'Work and Lifestyle', 'm'],
  ['online fraud and scams are becoming more common', 'Crime', 'h'],
  ['many city residents cannot afford to buy their own home', 'Government and Society', 'h'],
  ['levels of physical fitness among children are declining', 'Health', 'e'],
  ['more students are choosing to study abroad', 'Education', 'e'],
  ['public libraries are attracting fewer visitors', 'Culture', 'm'],
  ['many people sleep less than they did a generation ago', 'Health', 'm'],
  ['the number of private cars on the roads keeps growing', 'Environment', 'e'],
  ['young people show little interest in politics', 'Government and Society', 'h'],
  ['fewer families eat meals together regularly', 'Daily Life', 'e'],
];

const T2_POSNEG = [
  ['More and more people are choosing to work for themselves rather than for a company', 'Work and Lifestyle', 'm'],
  ['Families spend less time eating meals together than in the past', 'Daily Life', 'e'],
  ['Many people now get their news from social media rather than newspapers or television', 'Media', 'm'],
  ['Children spend more time on organised activities and less on free play', 'Education', 'm'],
  ['An increasing number of people follow the lives of celebrities closely', 'Culture', 'e'],
  ['Shopping has become one of the most popular leisure activities in many countries', 'Society', 'e'],
  ['More university courses are taught entirely online', 'Education', 'm'],
  ['People increasingly use translation apps instead of learning foreign languages', 'Technology', 'h'],
  ['Many companies now monitor their employees’ activity during working hours', 'Work and Lifestyle', 'h'],
  ['Cash is being used less and less in everyday transactions', 'Technology', 'm'],
  ['More people choose to live and work in different countries during their lives', 'Society', 'm'],
  ['Artificial intelligence is increasingly used to make decisions that affect people’s lives', 'Technology', 'h'],
  ['Young people increasingly look up to online influencers', 'Media', 'm'],
  ['Extended families are less likely to live together than in the past', 'Society', 'm'],
  ['A growing number of people buy second-hand goods rather than new products', 'Environment', 'e'],
  ['Many children now have their own social media accounts before secondary school', 'Technology', 'm'],
  ['People increasingly shop at large supermarkets rather than local markets', 'Daily Life', 'e'],
  ['A growing number of employees work for companies based in other countries without leaving home', 'Work and Lifestyle', 'h'],
  ['Many couples now share household duties and childcare equally', 'Society', 'e'],
  ['More towns are creating car-free zones in their centres', 'Environment', 'm'],
];

const T2_OUTWEIGH = [
  ['Working remotely instead of commuting to an office', 'Work and Lifestyle', 'm'],
  ['Allowing driverless vehicles on public roads', 'Technology', 'h'],
  ['Studying at university in another country', 'Education', 'e'],
  ['Taking a gap year between school and university', 'Education', 'e'],
  ['Replacing cash entirely with digital payments', 'Technology', 'm'],
  ['Using artificial intelligence to assist doctors with diagnosis', 'Technology', 'h'],
  ['Banning private cars from city centres', 'Environment', 'h'],
  ['Raising the minimum wage substantially', 'Government and Society', 'h'],
  ['Reading e-books instead of printed books', 'Education', 'e'],
  ['Children using tablets and laptops from an early age', 'Education', 'm'],
  ['Ordering meals through food delivery apps', 'Daily Life', 'e'],
  ['Shopping online rather than in physical shops', 'Daily Life', 'e'],
  ['Building more high-rise apartment blocks in cities', 'Society', 'm'],
  ['Encouraging tourists to visit remote natural areas', 'Environment', 'h'],
  ['Allowing employees to choose their own working hours', 'Work and Lifestyle', 'm'],
  ['Hosting major international sporting events', 'Government and Society', 'h'],
  ['Moving government services entirely online', 'Government and Society', 'm'],
  ['Keeping animals in zoos and wildlife parks', 'Environment', 'm'],
  ['Sending humans on missions to other planets', 'Technology', 'h'],
  ['Automating customer service with chatbots', 'Technology', 'm'],
  ['Teaching children at home instead of sending them to school', 'Education', 'h'],
  ['Living in a different country for part of one’s career', 'Work and Lifestyle', 'm'],
  ['Making public universities larger to admit more students', 'Education', 'h'],
  ['Encouraging people to shop at local businesses through tax breaks', 'Government and Society', 'm'],
  ['Using gene technology to improve food crops', 'Technology', 'h'],
];

const T2_RESP_PAIRS = [
  ['governments', 'individual citizens', [
    ['protecting the environment', 'Environment', 'm'],
    ['maintaining public health', 'Health', 'm'],
    ['improving road safety', 'Society', 'm'],
    ['caring for elderly people', 'Society', 'h'],
    ['reducing energy consumption', 'Environment', 'h'],
    ['preparing communities for natural disasters', 'Government and Society', 'h'],
  ]],
  ['schools', 'parents', [
    ['teaching children good manners and behaviour', 'Education', 'e'],
    ['developing healthy eating habits in children', 'Health', 'e'],
    ['teaching children how to manage money', 'Education', 'm'],
    ['keeping children safe online', 'Technology', 'm'],
    ['encouraging children to take regular exercise', 'Health', 'e'],
    ['developing a love of reading in children', 'Education', 'm'],
  ]],
  ['employers', 'employees themselves', [
    ['maintaining a healthy work-life balance', 'Work and Lifestyle', 'm'],
    ['developing professional skills and training', 'Work and Lifestyle', 'm'],
    ['looking after wellbeing in the workplace', 'Work and Lifestyle', 'h'],
    ['ensuring job satisfaction', 'Work and Lifestyle', 'h'],
  ]],
];

function buildTask2() {
  const items = [];
  for (const [s, g, l] of T2_AGREE) {
    items.push({ q: `${s}. To what extent do you agree or disagree?`, g, l, t: 'Opinion Essay' });
  }
  for (const [a, b, g, l] of T2_DISCUSS) {
    items.push({ q: `Some people think that ${a}, while others believe that ${b}. Discuss both views and give your own opinion.`, g, l, t: 'Discussion Essay' });
  }
  for (const [trend, g, l] of T2_CAUSE) {
    items.push({ q: `In many countries, ${trend}. What are the causes of this trend? What measures could be taken to address it?`, g, l, t: 'Cause-Solution Essay' });
    items.push({ q: `In many countries, ${trend}. Why is this happening? Is it a positive or negative development?`, g, l, t: 'Cause + Evaluation Essay' });
  }
  for (const [s, g, l] of T2_POSNEG) {
    items.push({ q: `${s}. Is this a positive or negative development?`, g, l, t: 'Evaluation Essay' });
  }
  for (const [s, g, l] of T2_OUTWEIGH) {
    items.push({ q: `${s} is becoming increasingly common. Do the advantages of this development outweigh the disadvantages?`, g, l, t: 'Advantages-Disadvantages Essay' });
  }
  for (const [a, b, issues] of T2_RESP_PAIRS) {
    for (const [issue, g, l] of issues) {
      items.push({ q: `Some people believe that ${a} should be mainly responsible for ${issue}, while others think this is the responsibility of ${b}. Discuss both views and give your own opinion.`, g, l, t: 'Discussion Essay' });
    }
  }
  for (const [p, g, l] of T2_PROBLEM) {
    items.push({ q: `Many countries are dealing with ${p}. What problems does this create? What solutions can you suggest?`, g, l, t: 'Problem-Solution Essay' });
  }
  for (const [q, g, l] of T2_FULL) {
    items.push({ q, g, l, t: 'Two-part Question Essay' });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 1 Academic
// ─────────────────────────────────────────────────────────────────────────────

const T1A_SUBJECTS = [
  'the number of cinema admissions', 'electricity production by fuel source', 'average house prices',
  'unemployment rates among young adults', 'the proportion of households with internet access', 'coffee production',
  'meat consumption per person', 'the number of cars per 1,000 people', 'recycling rates for household waste',
  'spending on fast food', 'the number of overseas students in higher education', 'average commuting times',
  'smartphone ownership by age group', 'CO2 emissions from transport', 'water consumption per household',
  'employment in agriculture, industry and services', 'visits to public libraries', 'participation in popular leisure activities',
  'sales of electric vehicles', 'attendance at live music events', 'international air passenger numbers',
  'the proportion of people cycling to work', 'the average age of first-time home buyers', 'the percentage of income spent on rent',
  'milk and dairy production', 'the number of hospital beds per capita', 'adult literacy rates',
  'participation in higher education by gender', 'average life expectancy', 'the share of energy from renewable sources',
  'fixed telephone and mobile phone subscriptions', 'daily television viewing time', 'book sales by format',
  'the number of museum visitors', 'rates of volunteering by age group', 'expenditure on research and development',
  'the number of new business start-ups', 'youth unemployment rates', 'the proportion of employees working part-time',
  'household waste generation', 'tourism revenue', 'the cost of university tuition', 'average school class sizes',
  'consumption of sugary drinks', 'the population aged over 65', 'urban and rural population shares',
  'annual spending on healthcare', 'the number of people learning a second language', 'internet shopping as a share of retail sales',
  'fish and seafood consumption',
];

const T1A_PROCESSES = [
  'how chocolate is produced from cocoa beans', 'how cement and concrete are made', 'how plastic bottles are recycled',
  'how glass containers are recycled', 'how paper is recycled into new products', 'how sugar is refined from sugar cane',
  'how olive oil is produced', 'how instant noodles are manufactured', 'how tea leaves are processed',
  'how silk cloth is produced', 'how wool is processed into clothing', 'how bricks are manufactured for the building industry',
  'how cheese is made from milk', 'how electricity is generated from coal', 'how solar panels generate electricity for homes',
  'how geothermal energy is used to produce electricity', 'how seawater is desalinated for drinking',
  'how drinking water is treated and supplied to homes', 'how milk is pasteurised and packaged',
  'how ceramic pottery is produced', 'how soft drinks are bottled in a factory', 'how honey is collected and packaged',
  'how leather goods are manufactured', 'how coffee beans are prepared for sale',
];

const T1A_NATURAL = [
  'the water cycle', 'the life cycle of a butterfly', 'the life cycle of a frog', 'the life cycle of a honey bee',
  'the life cycle of a chicken', 'the life cycle of a sea turtle', 'the life cycle of a dragonfly',
  'the carbon cycle', 'the nitrogen cycle in nature', 'how plants are pollinated', 'the rock cycle',
  'the life cycle of a silkworm',
];

const T1A_MAPS = [
  'a town centre in 1990 and the same area today', 'an island before and after the development of tourist facilities',
  'a village in 1960 and the present day', 'a school campus now and the plan for its expansion',
  'hospital grounds before and after redevelopment', 'a sports complex in 2005 and today',
  'a harbour area before and after modernisation', 'an airport now and the plan for its extension',
  'the ground floor of a museum in 2000 and today', 'a shopping street before and after pedestrianisation',
  'a riverside district before and after regeneration', 'two proposed sites for a new supermarket',
  'two proposed locations for a new railway station', 'a public park before and after its redesign',
  'a residential suburb in 1980 and the present day', 'an industrial area converted into a cultural quarter',
];

function buildTask1Academic() {
  const items = [];
  const scopes = ['in five countries', 'in a European country', 'in three countries', 'in four regions of one country', 'in six cities around the world'];
  const periods = [['1995', '2015'], ['2000', '2020'], ['2005', '2025'], ['1990', '2020'], ['2010', '2025']];
  T1A_SUBJECTS.forEach((s, i) => {
    const scope = scopes[i % scopes.length];
    const [y1, y2] = periods[i % periods.length];
    items.push({ q: `Two pie charts showing ${s} in one country in ${y1} and ${y2}`, g: 'Charts and visual data', l: 'e', t: 'Data description' });
    items.push({ q: `Table comparing ${s} ${scope} in ${y1} and ${y2}`, g: 'Charts and visual data', l: 'e', t: 'Data description' });
    items.push({ q: `Line graph showing ${s} ${scope} between ${y1} and ${y2}`, g: 'Charts and visual data', l: 'm', t: 'Data description' });
    items.push({ q: `Bar chart comparing ${s} ${scope} in ${y1} and ${y2}`, g: 'Charts and visual data', l: 'm', t: 'Data description' });
    items.push({ q: `Bar chart and line graph together showing ${s} ${scope} between ${y1} and ${y2}`, g: 'Charts and visual data', l: 'h', t: 'Data description' });
  });
  for (const p of T1A_PROCESSES) {
    items.push({ q: `Process diagram showing ${p}`, g: 'Charts and visual data', l: 'h', t: 'Data description' });
  }
  for (const n of T1A_NATURAL) {
    items.push({ q: `Diagram showing ${n}`, g: 'Charts and visual data', l: 'h', t: 'Data description' });
  }
  for (const m of T1A_MAPS) {
    items.push({ q: `Two maps showing ${m}`, g: 'Charts and visual data', l: 'h', t: 'Data description' });
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 1 General (letters)
// ─────────────────────────────────────────────────────────────────────────────

function letter(situation, recipient, bullets, g, l, t) {
  return {
    q: `${situation}\n\nWrite a letter to ${recipient}. In your letter:\n• ${bullets[0]}\n• ${bullets[1]}\n• ${bullets[2]}`,
    g, l, t,
  };
}

function buildTask1General() {
  const items = [];

  const products = ['a laptop', 'a smartphone', 'a washing machine', 'a bookshelf', 'a winter coat', 'a pair of headphones', 'a coffee machine', 'a bicycle', 'an office chair', 'a digital camera', 'a vacuum cleaner', 'a microwave oven', 'a pair of running shoes', 'a desk lamp'];
  const problems = [
    ['it arrived damaged', 'm'], ['it stopped working after a few days', 'm'],
    ['it was different from what was advertised', 'm'], ['important parts were missing from the box', 'h'],
    ['it arrived several weeks late and you missed an important occasion', 'h'],
  ];
  for (const p of products) {
    for (const [prob, l] of problems) {
      items.push(letter(
        `You recently bought ${p} from an online store, but ${prob}.`,
        'the company',
        ['describe what you bought and what was wrong with it', 'explain how the problem has affected you', 'say what you want the company to do'],
        'Formal Letter', l, 'Formal Letter',
      ));
    }
  }

  const services = ['a meal at a restaurant', 'a stay at a hotel', 'a long train journey', 'a flight with a budget airline', 'your mobile phone contract', 'your home internet service', 'your gym membership', 'an online language course', 'a taxi service you booked', 'a home repair service', 'a car rental booking', 'a guided city tour'];
  const serviceIssues = [
    ['the service was much worse than promised', 'm'], ['you were charged more than the advertised price', 'm'],
    ['your booking was cancelled at the last minute without explanation', 'h'], ['the staff were unhelpful when you complained at the time', 'h'],
  ];
  for (const s of services) {
    for (const [issue, l] of serviceIssues) {
      items.push(letter(
        `You recently paid for ${s}, but ${issue}.`,
        'the manager of the company',
        ['explain what you paid for and when', 'describe what went wrong', 'say what action you expect the company to take'],
        'Formal Letter', l, 'Formal Letter',
      ));
    }
  }

  const friendScenarios = [
    ['You have just moved to a new home in another city.', ['explain why you moved', 'describe your new home and neighbourhood', 'invite your friend to come and visit']],
    ['You recently returned from a holiday that you really enjoyed.', ['say where you went and who with', 'describe the most memorable part of the trip', 'recommend that your friend visits the same place']],
    ['You have started a new hobby that you think your friend would enjoy.', ['explain what the hobby is and how you started', 'describe what you enjoy about it', 'suggest trying it together']],
    ['You could not attend your friend’s recent celebration.', ['apologise for missing the event', 'explain what prevented you from coming', 'suggest a way to celebrate together soon']],
    ['Your friend has just been offered a new job.', ['congratulate your friend', 'say why you think they deserve it', 'suggest meeting to celebrate']],
    ['You are planning a trip to the country where your friend lives.', ['explain when and why you are coming', 'ask for advice about places to visit', 'suggest meeting up during your stay']],
    ['You borrowed something from your friend and accidentally damaged it.', ['explain what happened', 'apologise for the damage', 'say how you intend to repair or replace it']],
    ['You want advice about studying abroad, and your friend has experience of it.', ['explain your plans', 'ask about the challenges they faced', 'request practical advice about living there']],
    ['You recently received a gift from your friend.', ['thank your friend for the gift', 'explain why you like it', 'invite them to visit you soon']],
    ['You are organising a surprise party for a mutual friend.', ['explain what you are planning', 'ask for help with the arrangements', 'remind them to keep it a secret']],
    ['You have decided to take an English course in your friend’s city.', ['explain why you chose that city', 'ask about finding somewhere to stay', 'suggest activities you could do together']],
    ['You found an old photograph of you and your friend together.', ['describe the photograph and when it was taken', 'share a memory connected to it', 'suggest meeting up to catch up properly']],
    ['You have changed your plans for a trip you arranged with your friend.', ['apologise for the change', 'explain why your plans changed', 'suggest alternative dates']],
    ['Your friend is considering moving to your city for work.', ['say how you feel about the idea', 'describe the advantages and disadvantages of living there', 'offer to help them settle in']],
    ['You want to recommend a book or film you recently enjoyed.', ['say what you read or watched', 'explain why you enjoyed it so much', 'explain why you think they would like it too']],
    ['You recently won a small prize in a competition.', ['explain what the competition was', 'describe how you felt about winning', 'suggest how you would like to share or celebrate it']],
    ['You are selling something that your friend once said they would like to buy.', ['describe what you are selling and its condition', 'explain why you are selling it', 'suggest a fair price and how to arrange the sale']],
    ['You will be in your friend’s town for one day only.', ['explain why you will be there', 'suggest how you could spend the day together', 'ask them to confirm if they are free']],
  ];
  for (const [situation, bullets] of friendScenarios) {
    items.push(letter(situation, 'your friend', bullets, 'Informal Letter', 'e', 'Informal Letter'));
  }

  const neighbourScenarios = [
    ['Your neighbour often plays loud music late at night, which is affecting your sleep.', ['describe the problem and how long it has been happening', 'explain how it affects you', 'suggest a solution']],
    ['Your neighbour’s car frequently blocks the entrance to your driveway.', ['describe the situation', 'explain the difficulties it causes you', 'politely request a change']],
    ['You are planning a party that may be noisy.', ['explain the reason for the party and when it will take place', 'apologise in advance for any disturbance', 'invite them to join if they wish']],
    ['Your neighbour’s dog barks all day while they are at work.', ['explain the problem politely', 'describe how it affects your daily life', 'suggest what they could do about it']],
    ['You will be away for a month and need someone to keep an eye on your home.', ['explain where you are going and for how long', 'ask them to help with specific tasks', 'offer to do something in return']],
    ['A package addressed to you was delivered to your neighbour while you were out.', ['explain what happened', 'arrange a convenient time to collect it', 'thank them for their help']],
    ['You are organising a street event for all the residents of your road.', ['describe the event you are planning', 'explain how they could get involved', 'ask for their opinion or suggestions']],
    ['Building work at your neighbour’s house is causing problems for you.', ['describe the problems the work is causing', 'explain why the situation is difficult for you', 'suggest a compromise']],
    ['You accidentally damaged your neighbour’s fence while doing garden work.', ['explain what happened', 'apologise for the damage', 'offer to pay for or carry out the repairs']],
    ['You are new to the area and want to introduce yourself.', ['introduce yourself and your family', 'say where you moved from and why', 'invite them for coffee or a meal']],
    ['Rubbish from a shared bin area keeps spreading into your garden.', ['describe the problem', 'explain what you think is causing it', 'propose a solution for all neighbours']],
    ['Your neighbour helped you during a recent emergency.', ['remind them what happened', 'thank them for their help', 'offer to return the favour']],
  ];
  for (const [situation, bullets] of neighbourScenarios) {
    items.push(letter(situation, 'your neighbour', bullets, 'Semi-formal Letter', 'm', 'Semi-formal Letter'));
  }

  const landlordScenarios = [
    ['The heating system in the flat you rent has stopped working.', ['describe the problem and when it started', 'explain how it is affecting you', 'request urgent repairs']],
    ['There is a water leak in the bathroom of your rented flat.', ['describe the leak and the damage it is causing', 'explain why the matter is urgent', 'say what you want the landlord to do']],
    ['The washing machine provided with your rented flat has broken down.', ['explain what is wrong with the machine', 'describe the inconvenience it causes', 'ask for a repair or replacement']],
    ['You are moving out and want your deposit returned.', ['remind the landlord when your tenancy ends', 'describe the condition of the flat', 'ask for the deposit to be returned promptly']],
    ['You would like to redecorate one of the rooms in your rented home.', ['explain what changes you would like to make', 'reassure the landlord about the quality of the work', 'ask for written permission']],
    ['You have noticed signs of mice in your rented flat.', ['describe the problem and where you have noticed it', 'explain your concerns', 'request professional pest control']],
    ['You want to extend your tenancy agreement for another year.', ['say how long you have lived in the property', 'explain why you would like to stay', 'ask about the terms for renewal']],
    ['Your rent is due to increase and you want to negotiate.', ['refer to the proposed increase', 'explain why you think it is too high', 'make a counter-proposal']],
    ['The communal areas of your building are poorly maintained.', ['describe the state of the communal areas', 'explain the effect on residents', 'request regular maintenance']],
    ['You will be late paying your rent this month for the first time.', ['apologise and explain the reason', 'say when you will be able to pay', 'reassure the landlord it will not happen again']],
    ['A window in your rented flat does not close properly.', ['describe the fault and how long it has existed', 'explain the problems it causes, especially in cold weather', 'ask for it to be repaired quickly']],
    ['You want permission to keep a pet in your rented flat.', ['describe the pet you would like to keep', 'explain how you will prevent any damage or disturbance', 'ask for the landlord’s agreement']],
  ];
  for (const [situation, bullets] of landlordScenarios) {
    items.push(letter(situation, 'your landlord', bullets, 'Semi-formal Letter', 'm', 'Semi-formal Letter'));
  }

  const workScenarios = [
    ['You need to take two weeks of unpaid leave for personal reasons.', ['explain why you need the leave', 'suggest how your work could be covered', 'say when you would return'], 'your manager', 'm'],
    ['You would like to work from home two days a week.', ['explain why you are making the request', 'describe how you would stay productive', 'suggest a trial period'], 'your manager', 'h'],
    ['You have decided to resign from your job.', ['state that you are resigning and when you will leave', 'explain your reasons politely', 'thank your employer for the opportunities you were given'], 'your manager', 'm'],
    ['You will be away next week and need a colleague to handle your duties.', ['explain why you will be away', 'describe the tasks that need covering', 'offer to return the favour'], 'a colleague', 'e'],
    ['You want your company to pay for a training course.', ['describe the course and its cost', 'explain how it would benefit your work', 'ask for approval to enrol'], 'your manager', 'h'],
    ['The equipment in your office is old and slowing down your work.', ['describe the problems with the equipment', 'explain the impact on your productivity', 'recommend specific replacements'], 'your manager', 'm'],
    ['You believe a friend of yours would be ideal for a vacancy at your company.', ['describe your friend’s skills and experience', 'explain why they would suit the role', 'offer to make an introduction'], 'your manager', 'm'],
    ['You want to move to a different department within your company.', ['explain why you want to transfer', 'describe the skills you would bring', 'ask about the application process'], 'the human resources manager', 'h'],
    ['Your team achieved excellent results thanks to a colleague’s support.', ['describe what the team achieved', 'explain the colleague’s contribution', 'suggest how the company could recognise it'], 'your manager', 'm'],
    ['You have been asked to organise a farewell event for a retiring colleague.', ['explain the plans you have made so far', 'ask colleagues to contribute ideas or help', 'give details about the date and venue'], 'your colleagues', 'e'],
    ['Frequent meetings are making it difficult for you to finish your main tasks.', ['describe the problem', 'explain its effect on your work', 'propose a more efficient approach'], 'your manager', 'h'],
    ['You noticed a safety problem in your workplace.', ['describe the safety problem', 'explain the risks it creates', 'recommend what should be done'], 'the office manager', 'm'],
    ['You wish to thank a mentor who has recently helped your career.', ['remind them how they helped you', 'explain the difference it made', 'offer to help them in return one day'], 'your former mentor', 'e'],
    ['You must miss an important meeting due to a family commitment.', ['apologise for your absence in advance', 'explain the reason briefly', 'suggest how you will catch up on what you miss'], 'your manager', 'e'],
  ];
  for (const [situation, bullets, recipient, l] of workScenarios) {
    items.push(letter(situation, recipient, bullets, 'Semi-formal Letter', l, 'Semi-formal Letter'));
  }

  const councilScenarios = [
    ['The street lighting in your area has not worked for several weeks.', ['describe the problem and its location', 'explain the dangers it creates for residents', 'request prompt repairs']],
    ['Traffic near a local school has become dangerous for children.', ['describe the traffic problems', 'explain the risks to schoolchildren', 'suggest measures such as crossings or speed limits']],
    ['A local park has become neglected and dirty.', ['describe the current condition of the park', 'explain why the park matters to the community', 'suggest improvements']],
    ['Rubbish collections in your street are unreliable.', ['describe the problems with the current service', 'explain the effects on residents', 'request a more reliable schedule']],
    ['A bus route that many residents rely on is being cancelled.', ['explain who uses the route and why it matters', 'describe the consequences of cancelling it', 'urge the council to reconsider']],
    ['Your local library’s opening hours have been sharply reduced.', ['explain how the reduced hours affect different groups', 'describe the library’s value to the community', 'propose alternative ways to save money']],
    ['There are not enough sports facilities for young people in your area.', ['describe the current lack of facilities', 'explain the benefits new facilities would bring', 'suggest where they could be built']],
    ['Litter has become a serious problem in your town centre.', ['describe the litter problem', 'explain its effect on the town’s image and residents', 'suggest practical solutions']],
    ['Cyclists in your city need safer routes.', ['describe the dangers cyclists currently face', 'explain the benefits of safer cycling routes', 'propose specific improvements']],
    ['A historic building in your town is falling into disrepair.', ['describe the building and its condition', 'explain its importance to the town', 'urge the council to fund its restoration']],
    ['Your community centre is threatened with closure.', ['explain how the centre is used by residents', 'describe the impact its closure would have', 'suggest ways to keep it open']],
    ['Noise from late-night businesses is disturbing residents in your street.', ['describe the noise problem', 'explain its effect on residents', 'request that the council take action']],
    ['Your area needs more facilities for elderly residents.', ['describe the current situation for elderly people', 'explain what new facilities are needed', 'suggest how they could be provided']],
    ['Frequent flooding affects a road in your neighbourhood.', ['describe the flooding problem and when it occurs', 'explain the disruption it causes', 'ask for drainage improvements']],
  ];
  for (const [situation, bullets] of councilScenarios) {
    items.push(letter(situation, 'your local council', bullets, 'Formal Letter', 'h', 'Formal Letter'));
  }

  const editorScenarios = [
    ['Traffic congestion in your city has reached unacceptable levels.', ['describe the problem', 'explain its causes and effects', 'propose what should be done about it']],
    ['Green spaces in your town are disappearing because of new construction.', ['describe what is being lost', 'explain why green spaces matter', 'suggest how development and nature could be balanced']],
    ['There are too few activities for teenagers in your town.', ['describe the current situation', 'explain the problems this creates', 'propose what the town should provide']],
    ['Tourism is changing the character of your neighbourhood.', ['describe the changes you have noticed', 'discuss the benefits and problems tourism brings', 'suggest how the area could be protected']],
    ['A recent article about your neighbourhood was unfair and inaccurate.', ['identify the article and its claims', 'explain why the description was inaccurate', 'ask for a correction or a follow-up article']],
    ['Local shops are closing because of competition from large retailers.', ['describe what is happening to local shops', 'explain why independent shops matter to the community', 'suggest how residents and authorities could support them']],
    ['Public recycling facilities in your city are inadequate.', ['describe the current facilities', 'explain why they are insufficient', 'propose specific improvements']],
    ['You want to praise a local volunteer group whose work goes unnoticed.', ['describe the group and what it does', 'explain the difference it makes to the community', 'encourage readers to support it']],
  ];
  for (const [situation, bullets] of editorScenarios) {
    items.push(letter(situation, 'the editor of a local newspaper', bullets, 'Formal Letter', 'h', 'Formal Letter'));
  }

  const infoScenarios = [
    ['You saw an advertisement for an evening course that interests you.', ['say which course you are interested in', 'ask about dates, times and fees', 'ask whether any previous experience is required'], 'the college', 'e'],
    ['You want to join a local sports club.', ['explain which activities interest you', 'ask about membership costs and training times', 'ask how to register'], 'the club secretary', 'e'],
    ['You are interested in volunteering for a local charity.', ['explain why you want to volunteer', 'describe relevant skills or experience you have', 'ask what opportunities are available'], 'the charity', 'm'],
    ['You are planning a holiday and saw an advertisement for guided tours.', ['say where and when you want to travel', 'ask about prices and group sizes', 'ask what is included in the tour'], 'the tour company', 'e'],
    ['You want information about renting an apartment you saw advertised.', ['describe the kind of apartment you are looking for', 'ask about the rent and conditions', 'arrange a time to view it'], 'the letting agency', 'm'],
    ['You read about a summer job for students at a holiday resort.', ['explain why the job interests you', 'describe your relevant experience', 'ask about working hours, pay and accommodation'], 'the resort manager', 'm'],
    ['You would like to attend a conference related to your work.', ['say which conference you wish to attend', 'ask about registration fees and deadlines', 'ask whether group discounts are available'], 'the conference organisers', 'm'],
    ['A museum in another city is holding an exhibition you want to visit.', ['say which exhibition interests you', 'ask about opening times and ticket prices', 'ask whether guided tours are available'], 'the museum', 'e'],
    ['You want to enrol your child in a holiday activity programme.', ['describe your child’s age and interests', 'ask about the activities and supervision provided', 'ask about dates and costs'], 'the programme organiser', 'm'],
    ['You lost an item while travelling on public transport.', ['describe the item in detail', 'explain when and where you think you lost it', 'ask how to recover it if it is found'], 'the transport company', 'e'],
    ['You want to know more about a language school you found online.', ['explain your current level and learning goals', 'ask about course options and class sizes', 'ask about accommodation for international students'], 'the school', 'e'],
    ['You are organising an event and need to hire a venue.', ['describe the event and the expected number of guests', 'ask about availability and prices', 'ask what equipment and services are included'], 'the venue manager', 'm'],
    ['You saw a job advertisement but some details were unclear.', ['say which position you are interested in', 'ask for clarification about the unclear details', 'ask about the application deadline'], 'the company', 'm'],
    ['You want to find out about facilities for disabled visitors at a hotel.', ['explain your requirements', 'ask specific questions about access and facilities', 'ask whether assistance is available during the stay'], 'the hotel manager', 'm'],
  ];
  for (const [situation, bullets, recipient, l] of infoScenarios) {
    items.push(letter(situation, recipient, bullets, 'Formal Letter', l, 'Formal Letter'));
  }

  const arrangementScenarios = [
    ['You have an appointment next week that you can no longer attend.', ['refer to the appointment', 'explain why you cannot attend', 'suggest alternative dates'], 'the organisation', 'e'],
    ['You booked a hotel room but need to change the dates of your stay.', ['give your booking details', 'explain why your plans have changed', 'request new dates and confirmation'], 'the hotel', 'e'],
    ['You missed several classes of a course you are enrolled in.', ['apologise for your absence', 'explain the reasons', 'ask how you can catch up on the work you missed'], 'your teacher', 'e'],
    ['You need to return a product you bought and request a refund.', ['give the details of your purchase', 'explain why you are returning it', 'state how you would like to receive the refund'], 'the shop', 'm'],
    ['You are moving house and need to update your details with your bank.', ['give your account details and new address', 'say when the change takes effect', 'ask for written confirmation'], 'the bank', 'e'],
    ['You ordered tickets online but received the wrong ones.', ['describe what you ordered and what you received', 'explain why the mistake matters', 'ask for the correct tickets or a refund'], 'the ticket company', 'm'],
    ['You want to cancel a subscription you no longer use.', ['give your subscription details', 'explain why you are cancelling', 'ask for confirmation and any refund due'], 'the company', 'e'],
    ['You arranged to meet a business contact but must change the time.', ['refer to the planned meeting', 'apologise and explain the change', 'propose a new time and place'], 'your business contact', 'm'],
    ['A delivery you were expecting did not arrive on the agreed day.', ['give the order details', 'explain the inconvenience caused', 'ask for a new delivery time and compensation if appropriate'], 'the delivery company', 'm'],
    ['You need a reference letter for a job application.', ['remind them how they know you', 'describe the job you are applying for', 'politely ask them to write the reference before the deadline'], 'your former employer', 'm'],
    ['You reserved a table at a restaurant for a special occasion but must change the booking.', ['give the original booking details', 'explain the change you need', 'ask for confirmation of the new arrangement'], 'the restaurant', 'e'],
    ['You agreed to give a talk at a local event but are no longer available.', ['remind them of the agreed arrangement', 'apologise and explain why you must withdraw', 'suggest a replacement speaker or an alternative date'], 'the event organiser', 'm'],
  ];
  for (const [situation, bullets, recipient, l] of arrangementScenarios) {
    items.push(letter(situation, recipient, bullets, l === 'e' ? 'Semi-formal Letter' : 'Formal Letter', l, l === 'e' ? 'Semi-formal Letter' : 'Formal Letter'));
  }

  const schoolScenarios = [
    ['Your child is being given too much homework.', ['describe the amount of homework your child receives', 'explain the effect on your child', 'suggest a more reasonable approach'], 'h'],
    ['Your child will be absent from school for a family event abroad.', ['explain the reason for the absence and its dates', 'ask how your child can keep up with lessons', 'reassure the school about your child’s studies'], 'm'],
    ['You want to thank a teacher who has greatly helped your child.', ['explain how the teacher helped', 'describe the improvement in your child', 'suggest the school recognise the teacher’s work'], 'm'],
    ['The school canteen offers mainly unhealthy food.', ['describe the current food options', 'explain your concerns about children’s health', 'suggest healthier alternatives'], 'h'],
    ['Your child has lost confidence after changing class groups.', ['describe the change and its effect on your child', 'explain your concerns', 'ask for a meeting to discuss support'], 'h'],
    ['You would like the school to offer more after-school activities.', ['describe the current activities available', 'explain the benefits of a wider programme', 'offer to help as a volunteer parent'], 'm'],
    ['School buses in your area are overcrowded.', ['describe the problem', 'explain the safety concerns', 'request additional buses or a revised timetable'], 'h'],
    ['You want to enrol your child at a school in a new area.', ['introduce your family and your child', 'describe your child’s interests and needs', 'ask about places and the admission process'], 'm'],
    ['A school trip your child attended was poorly organised.', ['describe what went wrong on the trip', 'explain how it affected the children', 'ask what will be done differently in future'], 'h'],
    ['Your child needs extra support with one subject.', ['describe the difficulties your child is having', 'explain what support you provide at home', 'ask what additional help the school can offer'], 'm'],
  ];
  for (const [situation, bullets, l] of schoolScenarios) {
    items.push(letter(situation, 'the head teacher of your child’s school', bullets, 'Formal Letter', l, 'Formal Letter'));
  }

  const travelScenarios = [
    ['You stayed at a hotel last week and were very impressed by a member of staff.', ['give the details of your stay', 'describe what the staff member did', 'suggest how the hotel could recognise their service'], 'the hotel manager', 'm'],
    ['You left a personal item in your hotel room after checking out.', ['give the details of your stay', 'describe the item and where you think you left it', 'ask for it to be posted to you'], 'the hotel manager', 'e'],
    ['You booked a holiday apartment online but it did not match the photographs.', ['give your booking details', 'describe the differences you found', 'say what compensation you expect'], 'the booking company', 'h'],
    ['Your flight was delayed for twelve hours and the airline provided no assistance.', ['give the flight details', 'describe what happened during the delay', 'request compensation under the airline’s policy'], 'the airline', 'h'],
    ['You want to organise a surprise anniversary dinner at a hotel restaurant.', ['explain the occasion', 'describe the arrangements you would like', 'ask about availability and prices'], 'the hotel events manager', 'm'],
    ['You are planning a walking holiday and need local information.', ['explain your plans and dates', 'ask about routes and accommodation', 'ask about the best season for the trip'], 'a tourist information centre', 'e'],
    ['A tour guide made your recent trip especially memorable.', ['give the details of the tour', 'describe what the guide did so well', 'recommend that the company rewards them'], 'the tour company', 'm'],
    ['You became ill during a package holiday and the resort doctor helped you.', ['describe what happened', 'thank the resort for the assistance', 'suggest one improvement to their medical service'], 'the resort manager', 'h'],
    ['Your luggage was lost on a recent flight and has still not been returned.', ['give your flight and baggage details', 'describe the contents and value of the luggage', 'demand action and compensation'], 'the airline', 'h'],
    ['You want to book a campsite for a group of friends next summer.', ['describe your group and the dates', 'ask about facilities and rules', 'ask for a group discount'], 'the campsite manager', 'e'],
    ['The travel agency that arranged your trip gave you incorrect visa information.', ['explain what you were told and what happened', 'describe the consequences for your trip', 'state what you expect the agency to do'], 'the travel agency', 'h'],
    ['You read an inaccurate review of a guesthouse where you often stay.', ['explain your connection to the guesthouse', 'describe why the review is unfair', 'encourage the owners to respond publicly'], 'the guesthouse owners', 'm'],
  ];
  for (const [situation, bullets, recipient, l] of travelScenarios) {
    items.push(letter(situation, recipient, bullets, 'Formal Letter', l, 'Formal Letter'));
  }

  const universityScenarios = [
    ['You want to apply for a place on a degree course.', ['explain which course interests you and why', 'describe your qualifications and experience', 'ask about the application process and deadlines'], 'the university admissions office', 'm'],
    ['You need to defer your university place for one year.', ['give your course and offer details', 'explain why you need to defer', 'ask what steps you must take'], 'the admissions office', 'm'],
    ['You want to apply for a scholarship advertised by your university.', ['say which scholarship you are applying for', 'explain why you deserve it', 'describe how it would help your studies'], 'the scholarship committee', 'h'],
    ['The library at your college closes too early during the exam period.', ['describe the current opening hours', 'explain why they are inadequate during exams', 'propose extended hours'], 'the college director', 'm'],
    ['You missed an important exam because of illness.', ['explain what happened and provide context', 'apologise for the absence', 'ask about arrangements for a resit'], 'your course coordinator', 'm'],
    ['Your student accommodation has serious maintenance problems.', ['describe the problems in your room or building', 'explain the effect on your studies', 'request urgent repairs'], 'the accommodation office', 'm'],
    ['You want to change from full-time to part-time study.', ['explain your current course and situation', 'give your reasons for the change', 'ask about the procedure and implications'], 'the registrar', 'h'],
    ['A professor’s lectures have greatly influenced your career plans.', ['explain which course you took', 'describe the influence the lectures had', 'thank the professor and ask for career advice'], 'the professor', 'm'],
    ['You want to start a new student club at your college.', ['describe the club you want to start', 'explain why students would benefit', 'ask for permission and support'], 'the student affairs office', 'm'],
    ['You believe an error was made in your exam results.', ['give the details of the exam and your result', 'explain why you believe there is an error', 'request a review of your paper'], 'the examinations office', 'h'],
    ['You are an international student arriving next term and have questions.', ['introduce yourself and your course', 'ask about airport pickup and orientation', 'ask what documents you should bring'], 'the international student office', 'e'],
    ['You want to interview a local business owner for a college project.', ['introduce yourself and your project', 'explain why you chose their business', 'request a short interview at their convenience'], 'the business owner', 'e'],
  ];
  for (const [situation, bullets, recipient, l] of universityScenarios) {
    items.push(letter(situation, recipient, bullets, 'Formal Letter', l, 'Formal Letter'));
  }

  const communityScenarios = [
    ['You want to organise a charity fun run in your neighbourhood.', ['describe the event and its purpose', 'explain what support you need', 'ask for permission or sponsorship'], 'a local business', 'm'],
    ['A local charity helped your family during a difficult time.', ['describe how the charity helped you', 'explain what difference it made', 'offer to volunteer or donate in return'], 'the charity director', 'm'],
    ['You want to start a community vegetable garden on unused land.', ['describe the land and your idea', 'explain the benefits for residents', 'ask for permission and support'], 'the landowner', 'h'],
    ['You volunteered at a local festival and have suggestions for next year.', ['describe your role at the festival', 'explain what worked well and what did not', 'make suggestions for improvement'], 'the festival organisers', 'm'],
    ['Your sports team needs a new sponsor for the coming season.', ['describe your team and its achievements', 'explain what sponsorship would cover', 'describe the publicity the sponsor would receive'], 'a local company', 'h'],
    ['An elderly relative needs help at home and you are looking for a care service.', ['describe your relative’s situation and needs', 'ask about the services and staff available', 'ask about costs and availability'], 'a home care agency', 'm'],
    ['You want to donate books and equipment to a local school.', ['describe what you would like to donate', 'explain why you are making the donation', 'ask how to arrange the delivery'], 'the school office', 'e'],
    ['Your apartment building needs a better recycling system.', ['describe the current arrangements', 'explain the problems they cause', 'propose a better system for all residents'], 'the building management company', 'm'],
    ['You witnessed a minor accident and the affected person asked you to confirm what you saw.', ['say where and when the accident happened', 'describe exactly what you saw', 'confirm you are willing to provide further details'], 'the insurance company', 'h'],
    ['You want to book a community hall for a family celebration.', ['describe the event and the expected guests', 'ask about availability, cost and rules', 'ask what facilities are included'], 'the hall manager', 'e'],
    ['A youth club you attended as a teenager is asking former members for support.', ['describe what the club meant to you', 'explain how it influenced your life', 'say how you are willing to help now'], 'the club organisers', 'm'],
    ['Street art has appeared in your area and opinions are divided.', ['describe the artwork and where it is', 'give your own opinion about it', 'suggest how the community should decide its future'], 'your residents’ association', 'h'],
  ];
  for (const [situation, bullets, recipient, l] of communityScenarios) {
    items.push(letter(situation, recipient, bullets, 'Semi-formal Letter', l, 'Semi-formal Letter'));
  }

  const officialScenarios = [
    ['You noticed a payment on your bank statement that you do not recognise.', ['give your account details and the date of the payment', 'explain why you believe it is an error', 'ask the bank to investigate and refund the amount'], 'your bank', 'm'],
    ['Your bank card was swallowed by a cash machine at the weekend.', ['explain when and where it happened', 'describe the inconvenience it has caused', 'ask for a replacement card urgently'], 'your bank', 'e'],
    ['You want to apply for a small loan to start a home business.', ['describe your business idea briefly', 'explain how much you need and why', 'ask about repayment terms and the application process'], 'the bank manager', 'h'],
    ['Your monthly electricity bill is much higher than usual and you suspect a mistake.', ['give your customer details and the bill in question', 'explain why you believe the amount is wrong', 'ask for the bill to be checked and corrected'], 'the electricity company', 'm'],
    ['Roadworks outside your home were left unfinished weeks ago.', ['describe the state of the roadworks', 'explain the problems they cause residents', 'ask when the work will be completed'], 'the works department', 'm'],
    ['You received excellent service from a government office and want to give feedback.', ['describe the service you received', 'praise the staff member who helped you', 'suggest the office shares this example of good practice'], 'the office manager', 'e'],
    ['You applied for an official document a month ago but have heard nothing.', ['give the details of your application', 'explain why the delay is causing problems', 'ask for the application to be processed urgently'], 'the issuing office', 'm'],
    ['Your home insurance claim was rejected and you disagree with the decision.', ['give your policy and claim details', 'explain why you believe the decision is wrong', 'request a formal review of your claim'], 'the insurance company', 'h'],
    ['You are moving abroad and need to close several accounts and services.', ['explain when you are leaving', 'list the services you need to cancel', 'ask for written confirmation of the closures'], 'your service provider', 'm'],
    ['You want to set up a market stall selling homemade food at weekends.', ['describe what you plan to sell', 'explain your food hygiene arrangements', 'ask about permits and fees'], 'the market authority', 'h'],
    ['A tree on public land is dangerously close to falling onto your property.', ['describe the tree and its condition', 'explain the danger it poses', 'request an inspection and action'], 'the parks department', 'm'],
    ['You wish to register for a postal vote in the next election.', ['explain why you cannot vote in person', 'give the details needed for registration', 'ask for confirmation that your application has been accepted'], 'the electoral office', 'e'],
  ];
  for (const [situation, bullets, recipient, l] of officialScenarios) {
    items.push(letter(situation, recipient, bullets, 'Formal Letter', l, 'Formal Letter'));
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge into topics.json
// ─────────────────────────────────────────────────────────────────────────────

function mergeSection(data, sectionName, generated, idPrefix) {
  const bank = data.topicBank.find(
    (b) => b.exam === 'IELTS' && b.skill === 'Writing' && b.section === sectionName,
  );
  if (!bank) throw new Error(`Section not found: ${sectionName}`);

  // Idempotent: drop previously generated topics.
  bank.topics = bank.topics.filter((t) => !t.id.includes('-gen-'));

  const existingNames = new Set(bank.topics.map((t) => t.topicName.toLowerCase()));
  let no = Math.max(...bank.topics.map((t) => t.topicNo)) ;
  let added = 0;

  for (const item of generated) {
    const key = item.q.toLowerCase();
    if (existingNames.has(key)) continue;
    existingNames.add(key);
    no += 1;
    added += 1;
    bank.topics.push({
      id: `${idPrefix}-gen-${String(added).padStart(3, '0')}`,
      topicNo: no,
      topicName: item.q,
      topicGroup: item.g,
      level: LEVEL[item.l],
      taskType: item.t,
      source: SOURCE,
    });
  }

  bank.topicCount = bank.topics.length;

  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  for (const t of bank.topics) {
    const lvl = t.level.includes('Beginner') ? 'Easy' : t.level.includes('Intermediate') ? 'Medium' : 'Hard';
    counts[lvl] += 1;
  }
  console.log(`${sectionName}: +${added} generated, total ${bank.topics.length} (Easy ${counts.Easy} / Medium ${counts.Medium} / Hard ${counts.Hard})`);
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

mergeSection(data, 'Task 2 Essay', buildTask2(), 'ielts-writing-task-2-essay');
mergeSection(data, 'Task 1 Academic', buildTask1Academic(), 'ielts-writing-task-1-academic');
mergeSection(data, 'Task 1 General', buildTask1General(), 'ielts-writing-task-1-general');

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('topics.json updated.');
