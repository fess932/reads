export interface Chapter {
  id: number;
  title: string;
  duration: number; // seconds
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string; // CSS gradient
  year: number;
  chapters: Chapter[];
}

export const books: Book[] = [
  {
    id: "master-margarita",
    title: "Мастер и Маргарита",
    author: "Михаил Булгаков",
    year: 1967,
    cover: "linear-gradient(160deg, #1a237e 0%, #6a1b9a 100%)",
    chapters: [
      {
        id: 1,
        title: "Никогда не разговаривайте с неизвестными",
        duration: 1122,
      },
      { id: 2, title: "Понтий Пилат", duration: 987 },
      { id: 3, title: "Седьмое доказательство", duration: 756 },
      { id: 4, title: "Погоня", duration: 834 },
      { id: 5, title: "Дело было в Грибоедове", duration: 1089 },
      { id: 6, title: "Шизофрения, как и было сказано", duration: 672 },
      { id: 7, title: "Нехорошая квартира", duration: 918 },
    ],
  },
  {
    id: "crime-punishment",
    title: "Преступление и наказание",
    author: "Фёдор Достоевский",
    year: 1866,
    cover: "linear-gradient(160deg, #7f0000 0%, #b71c1c 100%)",
    chapters: [
      { id: 1, title: "Часть первая, I", duration: 1342 },
      { id: 2, title: "Часть первая, II", duration: 1187 },
      { id: 3, title: "Часть первая, III", duration: 956 },
      { id: 4, title: "Часть вторая, I", duration: 1423 },
      { id: 5, title: "Часть вторая, II", duration: 876 },
      { id: 6, title: "Часть третья, I", duration: 1102 },
    ],
  },
  {
    id: "idiot",
    title: "Идиот",
    author: "Фёдор Достоевский",
    year: 1869,
    cover: "linear-gradient(160deg, #004d40 0%, #00695c 100%)",
    chapters: [
      { id: 1, title: "Часть первая, I", duration: 1560 },
      { id: 2, title: "Часть первая, II", duration: 1230 },
      { id: 3, title: "Часть первая, III", duration: 890 },
      { id: 4, title: "Часть вторая, I", duration: 1340 },
      { id: 5, title: "Часть вторая, II", duration: 760 },
    ],
  },
  {
    id: "anna-karenina",
    title: "Анна Каренина",
    author: "Лев Толстой",
    year: 1877,
    cover: "linear-gradient(160deg, #e65100 0%, #bf360c 100%)",
    chapters: [
      { id: 1, title: "Всё смешалось в доме Облонских", duration: 1045 },
      { id: 2, title: "Степан Аркадьич Облонский", duration: 932 },
      { id: 3, title: "Приезд Кити", duration: 1123 },
      { id: 4, title: "На балу", duration: 867 },
      { id: 5, title: "Отъезд Вронского", duration: 743 },
      { id: 6, title: "В Москве", duration: 1234 },
    ],
  },
  {
    id: "three-musketeers",
    title: "Три мушкетёра",
    author: "Александр Дюма",
    year: 1844,
    cover: "linear-gradient(160deg, #0d47a1 0%, #1565c0 100%)",
    chapters: [
      { id: 1, title: "Три подарка г-на д'Артаньяна-отца", duration: 1189 },
      { id: 2, title: "Приёмная г-на де Тревиля", duration: 1023 },
      { id: 3, title: "Аудиенция", duration: 934 },
      {
        id: 4,
        title: "Плечо Атоса, перевязь Портоса и платок Арамиса",
        duration: 1456,
      },
      {
        id: 5,
        title: "Королевские мушкетёры и гвардейцы кардинала",
        duration: 812,
      },
      { id: 6, title: "Его превосходительство г-н Атос", duration: 978 },
      { id: 7, title: "Внутренность де Тревиля", duration: 645 },
    ],
  },
  {
    id: "little-prince",
    title: "Маленький принц",
    author: "Антуан де Сент-Экзюпери",
    year: 1943,
    cover: "linear-gradient(160deg, #1b5e20 0%, #388e3c 100%)",
    chapters: [
      { id: 1, title: "Глава I. Рисунок удава", duration: 412 },
      { id: 2, title: "Глава II. Встреча в пустыне", duration: 534 },
      { id: 3, title: "Глава III. Маленький принц", duration: 478 },
      { id: 4, title: "Глава IV. Астероид Б-612", duration: 623 },
      { id: 5, title: "Глава V. Баобабы", duration: 389 },
      { id: 6, title: "Глава VI. Закаты", duration: 356 },
      { id: 7, title: "Глава XXI. Лис", duration: 712 },
    ],
  },
];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
