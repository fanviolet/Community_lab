import type { Problem } from "@/types/problem";

export const mockProblems: Problem[] = [
  {
    id: "1",
    title: "Thiếu không gian học tập yên tĩnh sau giờ học",
    description:
      "Học sinh THPT không có phòng tự học đủ sáng vào buổi tối, ảnh hưởng đến kết quả ôn thi và làm bài nhóm.",
    votes: 48,
    comments: 16,
    tag: "Education",
    priority: "High",
  },
  {
    id: "2",
    title: "Rác thải nhựa quanh kênh đi qua trường",
    description:
      "Sau mưa, rác từ khu chợ trôi về kênh gần cổng trường, gây mùi hôi và nguy cơ tắc thoát nước.",
    votes: 62,
    comments: 24,
    tag: "Environment",
    priority: "High",
  },
  {
    id: "3",
    title: "Ngã ba đường trước trường thiếu đèn và vạch sang đường",
    description:
      "Học sinh đi xe đạp và đi bộ gặp khó khăn vào giờ tan học, đã có vài tình huống suýt xảy ra va chạm.",
    votes: 55,
    comments: 19,
    tag: "Community",
    priority: "High",
  },
  {
    id: "4",
    title: "Trường vùng cao thiếu thiết bị học STEM cơ bản",
    description:
      "Nhiều lớp chưa có máy tính và bộ kit thí nghiệm đơn giản, học sinh khó tiếp cận môn khoa học thực hành.",
    votes: 41,
    comments: 11,
    tag: "Education",
    priority: "Medium",
  },
  {
    id: "5",
    title: "Chưa có chương trình AI learning phù hợp cho học sinh",
    description:
      "Giáo viên muốn dạy AI có trách nhiệm nhưng thiếu giáo trình tiếng Việt và công cụ thực hành an toàn.",
    votes: 37,
    comments: 14,
    tag: "Technology",
    priority: "Medium",
  },
  {
    id: "6",
    title: "Ít hoạt động cộng đồng kết nối học sinh với người cao tuổi",
    description:
      "Cộng đồng địa phương mong có các buổi hỗ trợ công nghệ và trò chuyện do học sinh tổ chức định kỳ.",
    votes: 29,
    comments: 9,
    tag: "Community",
    priority: "Low",
  },
];
