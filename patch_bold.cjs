const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

code = code.replace(
  'storyP1: "Every great company starts with a simple realization: managing a team shouldn’t feel like fighting your own tools.",',
  'storyP1: <>Every great company starts with a simple realization: <strong>managing a team shouldn’t feel like fighting your own tools.</strong></>,'
);

code = code.replace(
  'storyP3: "We set out to rebuild workplace management from the ground up.",',
  'storyP3: <><strong>We set out to rebuild workplace management from the ground up.</strong></>,'
);

code = code.replace(
  'storyP1: "គ្រប់អាជីវកម្មជោគជ័យទាំងអស់ តែងតែចាប់ផ្តើមចេញពីការយល់ឃើញដ៏សាមញ្ញមួយ៖ «ការគ្រប់គ្រងល្អ មានវិន័យ សុក្រឹត និងតម្លាភាព នាំមកនូវជោគជ័យដល់អាជីវកម្ម»។",',
  'storyP1: <>គ្រប់អាជីវកម្មជោគជ័យទាំងអស់ តែងតែចាប់ផ្តើមចេញពីការយល់ឃើញដ៏សាមញ្ញមួយ៖ <strong>«ការគ្រប់គ្រងល្អ មានវិន័យ សុក្រឹត និងតម្លាភាព នាំមកនូវជោគជ័យដល់អាជីវកម្ម»។</strong></>,'
);

code = code.replace(
  'storyP3: "យើងបានចាប់ផ្តើមបង្កើតប្រព័ន្ធគ្រប់គ្រងការងារឡើងវិញដោយយកបញ្ហាខាងលើមកដោះស្រាយ",',
  'storyP3: <><strong>យើងបានចាប់ផ្តើមបង្កើតប្រព័ន្ធគ្រប់គ្រងការងារឡើងវិញដោយយកបញ្ហាខាងលើមកដោះស្រាយ</strong></>,'
);

fs.writeFileSync('src/pages/Landing.tsx', code);
