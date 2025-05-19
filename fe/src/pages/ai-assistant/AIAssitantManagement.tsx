import React, { useState } from 'react';
import { 
  Bot, MessageSquare, BarChart2, Send, HelpCircle, Settings,
  AlertTriangle, CheckCircle, ChevronDown, RefreshCw, Tag, Database, 
  Edit, Plus, Trash2, Book, Search
} from 'lucide-react';

// Types for AI Assistant data
interface AIAssistantLog {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  intentType: string;
  querySource: 'text' | 'voice' | 'suggestion';
  userId?: string;
  userName?: string;
  deviceInfo?: {
    device: string;
    browser: string;
    os: string;
  };
  responseTime: number;
  feedback?: {
    isHelpful: boolean;
    comments?: string;
    providedAt: string;
  };
}

interface Intent {
  id: string;
  name: string;
  description: string;
  trainingPhrases: string[];
  responses: string[];
  isActive: boolean;
}

interface RecentQuery {
  query: string;
  count: number;
  intentType: string;
  lastAsked: string;
}

// Mock data
const generateMockAILogs = (): AIAssistantLog[] => {
  const intentTypes = [
    'greeting', 'product_inquiry', 'order_status', 'cooking_tips', 
    'product_recommendation', 'general', 'error'
  ];
  
  return Array(50).fill(null).map((_, index) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 10000));
    
    const intentType = intentTypes[Math.floor(Math.random() * intentTypes.length)];
    const responseTime = Math.floor(Math.random() * 2000) + 200;
    const hasFeedback = Math.random() > 0.6;
    
    let query = '';
    let response = '';
    
    switch (intentType) {
      case 'greeting':
        query = ['Xin chào', 'Chào bạn', 'Chào shop', 'Bạn có ở đó không?'][Math.floor(Math.random() * 4)];
        response = ['Xin chào! Tôi có thể giúp gì cho bạn?', 'Chào mừng bạn đến với shop! Bạn cần tìm sản phẩm gì?'][Math.floor(Math.random() * 2)];
        break;
      case 'product_inquiry':
        query = ['Dao này có bảo hành không?', 'Chảo này dùng cho bếp từ được không?', 'Nồi nấu cơm này có tốt không?'][Math.floor(Math.random() * 3)];
        response = 'Dạ, sản phẩm này được bảo hành chính hãng 12 tháng và phù hợp với mọi loại bếp. Bạn có thể tham khảo thêm thông tin chi tiết ở mục mô tả sản phẩm.';
        break;
      case 'order_status':
        query = ['Đơn hàng của tôi đến đâu rồi?', 'Mã đơn DH20240123-456 giao đến đâu rồi?', 'Tôi đặt hàng lúc nào sẽ nhận được?'][Math.floor(Math.random() * 3)];
        response = 'Đơn hàng của bạn hiện đang trong quá trình vận chuyển và dự kiến sẽ được giao trong 2-3 ngày tới. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi".';
        break;
      case 'cooking_tips':
        query = ['Làm thế nào để nấu cơm ngon?', 'Cách chọn dao phù hợp để thái thịt?', 'Mẹo sử dụng nồi áp suất an toàn?'][Math.floor(Math.random() * 3)];
        response = 'Để nấu cơm ngon, bạn nên ngâm gạo khoảng 30 phút trước khi nấu, cho lượng nước vừa phải (tỷ lệ gạo:nước là 1:1.25), và để cơm nghỉ 10 phút sau khi nấu. Bạn có thể tham khảo thêm các công thức nấu ăn trong mục "Công thức" trên website của chúng tôi.';
        break;
      case 'product_recommendation':
        query = ['Gợi ý cho tôi bộ dao phù hợp', 'Tôi nên mua nồi loại nào để nấu cơm?', 'Chảo tốt nhất để chiên trứng?'][Math.floor(Math.random() * 3)];
        response = 'Dựa trên nhu cầu của bạn, tôi gợi ý bộ dao Zwilling Pro với chất lượng cao và độ sắc bén tuyệt vời. Bộ sản phẩm này có đầy đủ các loại dao phù hợp cho việc chế biến thực phẩm hàng ngày. Bạn có thể xem thêm chi tiết sản phẩm tại đây.';
        break;
      case 'general':
        query = ['Giờ mở cửa của shop là mấy giờ?', 'Các phương thức thanh toán?', 'Chính sách đổi trả như thế nào?'][Math.floor(Math.random() * 3)];
        response = 'Shop mở cửa từ 8h sáng đến 22h tối tất cả các ngày trong tuần. Chúng tôi chấp nhận nhiều phương thức thanh toán bao gồm tiền mặt khi nhận hàng, thẻ tín dụng/ghi nợ, và các ví điện tử phổ biến như MoMo, ZaloPay, và VNPay.';
        break;
      case 'error':
        query = ['$$$', 'asjdhgasjhgd', '...', '/help command'][Math.floor(Math.random() * 4)];
        response = 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Bạn có thể diễn đạt lại hoặc hỏi câu hỏi khác được không?';
        break;
    }
    
    return {
      id: `log-${1000 + index}`,
      query,
      response,
      timestamp: date.toISOString(),
      intentType,
      querySource: ['text', 'voice', 'suggestion'][Math.floor(Math.random() * 3)] as 'text' | 'voice' | 'suggestion',
      userId: Math.random() > 0.3 ? `user-${1000 + Math.floor(Math.random() * 500)}` : undefined,
      userName: Math.random() > 0.3 ? ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'][Math.floor(Math.random() * 5)] : undefined,
      deviceInfo: {
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
        os: ['Windows', 'macOS', 'iOS', 'Android'][Math.floor(Math.random() * 4)],
      },
      responseTime,
      feedback: hasFeedback ? {
        isHelpful: Math.random() > 0.2,
        comments: Math.random() > 0.7 ? 'Phản hồi rất hữu ích, cảm ơn!' : undefined,
        providedAt: new Date(date.getTime() + 60000 + Math.floor(Math.random() * 300000)).toISOString()
      } : undefined
    };
  });
};

const mockIntents: Intent[] = [
  {
    id: 'intent-1',
    name: 'greeting',
    description: 'Chào hỏi người dùng',
    trainingPhrases: [
      'Xin chào',
      'Chào bạn',
      'Chào shop',
      'Bạn có ở đó không?',
      'Hello',
      'Hi',
    ],
    responses: [
      'Xin chào! Tôi có thể giúp gì cho bạn?',
      'Chào mừng bạn đến với shop! Bạn cần tìm sản phẩm gì?',
      'Chào bạn! Tôi là trợ lý ảo của shop. Tôi có thể giúp gì cho bạn hôm nay?',
    ],
    isActive: true
  },
  {
    id: 'intent-2',
    name: 'product_inquiry',
    description: 'Thông tin về sản phẩm',
    trainingPhrases: [
      'Sản phẩm này có bảo hành không?',
      'Dao này có bảo hành không?',
      'Chảo này dùng cho bếp từ được không?',
      'Sản phẩm này có chất lượng không?',
      'Đặc điểm của sản phẩm',
      'Thông tin chi tiết về sản phẩm',
    ],
    responses: [
      'Dạ, sản phẩm này được bảo hành chính hãng 12 tháng và phù hợp với mọi loại bếp. Bạn có thể tham khảo thêm thông tin chi tiết ở mục mô tả sản phẩm.',
      'Sản phẩm này có chất lượng cao và được bảo hành 12 tháng. Bạn có thể xem thêm thông tin chi tiết trong phần mô tả sản phẩm.',
    ],
    isActive: true
  },
  {
    id: 'intent-3',
    name: 'order_status',
    description: 'Trạng thái đơn hàng',
    trainingPhrases: [
      'Đơn hàng của tôi đến đâu rồi?',
      'Mã đơn DH12345 giao đến đâu rồi?',
      'Tôi đặt hàng lúc nào sẽ nhận được?',
      'Theo dõi đơn hàng',
      'Trạng thái đơn hàng',
    ],
    responses: [
      'Để kiểm tra trạng thái đơn hàng, bạn vui lòng cung cấp mã đơn hàng hoặc đăng nhập vào tài khoản để xem chi tiết.',
      'Đơn hàng của bạn hiện đang trong quá trình vận chuyển và dự kiến sẽ được giao trong 2-3 ngày tới. Bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi".',
    ],
    isActive: true
  },
  {
    id: 'intent-4',
    name: 'cooking_tips',
    description: 'Mẹo nấu ăn',
    trainingPhrases: [
      'Làm thế nào để nấu cơm ngon?',
      'Cách chọn dao phù hợp để thái thịt?',
      'Mẹo sử dụng nồi áp suất an toàn?',
      'Làm sao để chảo không bị dính?',
      'Bí quyết nấu ăn',
    ],
    responses: [
      'Để nấu cơm ngon, bạn nên ngâm gạo khoảng 30 phút trước khi nấu, cho lượng nước vừa phải (tỷ lệ gạo:nước là 1:1.25), và để cơm nghỉ 10 phút sau khi nấu. Bạn có thể tham khảo thêm các công thức nấu ăn trong mục "Công thức" trên website của chúng tôi.',
      'Khi chọn dao để thái thịt, bạn nên chọn loại dao có lưỡi dày và sắc. Dao thái thịt thường có lưỡi dài khoảng 20cm và cứng để có thể cắt qua thịt và xương một cách dễ dàng.',
    ],
    isActive: true
  },
  {
    id: 'intent-5',
    name: 'product_recommendation',
    description: 'Gợi ý sản phẩm',
    trainingPhrases: [
      'Gợi ý cho tôi bộ dao phù hợp',
      'Tôi nên mua nồi loại nào để nấu cơm?',
      'Chảo tốt nhất để chiên trứng?',
      'Sản phẩm phù hợp để làm bếp',
      'Gợi ý sản phẩm nấu ăn',
    ],
    responses: [
      'Dựa trên nhu cầu của bạn, tôi gợi ý bộ dao Zwilling Pro với chất lượng cao và độ sắc bén tuyệt vời. Bộ sản phẩm này có đầy đủ các loại dao phù hợp cho việc chế biến thực phẩm hàng ngày.',
      'Để nấu cơm, tôi khuyên bạn nên chọn nồi cơm điện Zojirushi hoặc Cuckoo với công nghệ nấu áp suất và lớp chống dính cao cấp. Những sản phẩm này giúp cơm chín đều và giữ ấm lâu.',
    ],
    isActive: true
  },
];

const mockRecentQueries: RecentQuery[] = [
  { query: 'Chảo chống dính loại nào tốt?', count: 45, intentType: 'product_recommendation', lastAsked: '1 giờ trước' },
  { query: 'Làm thế nào để nấu cơm ngon?', count: 38, intentType: 'cooking_tips', lastAsked: '30 phút trước' },
  { query: 'Bảo hành dao 12 tháng như thế nào?', count: 32, intentType: 'product_inquiry', lastAsked: '2 giờ trước' },
  { query: 'Đơn hàng của tôi khi nào được giao?', count: 29, intentType: 'order_status', lastAsked: '15 phút trước' },
  { query: 'Cách sử dụng nồi áp suất an toàn', count: 24, intentType: 'cooking_tips', lastAsked: '1 giờ trước' },
  { query: 'Cửa hàng mở cửa đến mấy giờ?', count: 21, intentType: 'general', lastAsked: '45 phút trước' },
  { query: 'Dao Zwilling có tốt không?', count: 19, intentType: 'product_inquiry', lastAsked: '3 giờ trước' },
];

const mockAILogs = generateMockAILogs();

const AIAssistantManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'intents' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('');
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);

  const logsPerPage = 10;
  const indexOfLastLog = currentLogPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;

  // Filter logs based on search and filter criteria
  const filteredLogs = mockAILogs.filter(log => {
    const matchesSearch = log.query.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.response.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIntent = filterIntent ? log.intentType === filterIntent : true;
    
    return matchesSearch && matchesIntent;
  });

  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Calculate intent distribution for analytics
  const intentDistribution = mockAILogs.reduce((acc, log) => {
    acc[log.intentType] = (acc[log.intentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate feedback statistics
  const feedbackStats = {
    total: mockAILogs.filter(log => log.feedback).length,
    helpful: mockAILogs.filter(log => log.feedback?.isHelpful).length,
    notHelpful: mockAILogs.filter(log => log.feedback && !log.feedback.isHelpful).length,
  };

  // Average response time
  const avgResponseTime = Math.round(
    mockAILogs.reduce((sum, log) => sum + log.responseTime, 0) / mockAILogs.length
  );

  // Intent form handlers
  const handleIntentEdit = (intent: Intent) => {
    setSelectedIntent(intent);
    setShowIntentModal(true);
  };

  const handleIntentCreate = () => {
    setSelectedIntent({
      id: `intent-${Date.now()}`,
      name: '',
      description: '',
      trainingPhrases: [''],
      responses: [''],
      isActive: true
    });
    setShowIntentModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bot className="mr-2" size={24} />
          Trợ lý AI
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 className="mr-2 h-5 w-5 inline-block" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversations'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="mr-2 h-5 w-5 inline-block" />
            Lịch sử hội thoại
          </button>
          <button
            onClick={() => setActiveTab('intents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'intents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="mr-2 h-5 w-5 inline-block" />
            Quản lý Intent
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="mr-2 h-5 w-5 inline-block" />
            Cài đặt
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tổng hội thoại</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{mockAILogs.length.toLocaleString()}</h3>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-sm text-gray-500">
                  Trong 30 ngày qua
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Thời gian phản hồi</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{avgResponseTime} ms</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-sm text-gray-500">
                  Thời gian phản hồi trung bình
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tỷ lệ phản hồi</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    {feedbackStats.total > 0 
                      ? Math.round((feedbackStats.helpful / feedbackStats.total) * 100) 
                      : 0}%
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-sm text-gray-500">
                  {feedbackStats.helpful}/{feedbackStats.total} phản hồi hữu ích
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Không hiểu intent</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">
                    {intentDistribution['error'] || 0}
                  </h3>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-sm text-gray-500">
                  {((intentDistribution['error'] || 0) / mockAILogs.length * 100).toFixed(1)}% tổng truy vấn
                </span>
              </div>
            </div>
          </div>

          {/* Intent Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Phân bố Intent</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intent
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tỷ lệ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(intentDistribution)
                      .sort(([, countA], [, countB]) => countB - countA)
                      .map(([intent, count]) => (
                        <tr key={intent} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {intent}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {(count / mockAILogs.length * 100).toFixed(1)}%
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-indigo-600 h-1.5 rounded-full" 
                                style={{ width: `${(count / mockAILogs.length * 100).toFixed(1)}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Truy vấn phổ biến</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truy vấn
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intent
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gần nhất
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockRecentQueries.map((query, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {query.query}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {query.intentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {query.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {query.lastAsked}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm hội thoại..."
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
                    value={filterIntent}
                    onChange={(e) => setFilterIntent(e.target.value)}
                  >
                    <option value="">Tất cả intent</option>
                    <option value="greeting">Greeting</option>
                    <option value="product_inquiry">Product Inquiry</option>
                    <option value="order_status">Order Status</option>
                    <option value="cooking_tips">Cooking Tips</option>
                    <option value="product_recommendation">Product Recommendation</option>
                    <option value="general">General</option>
                    <option value="error">Error</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Logs */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thời gian
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Người dùng
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Truy vấn
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Intent
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phản hồi
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.userName || 'Khách vãng lai'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.deviceInfo?.device} • {log.deviceInfo?.browser}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.query}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.querySource === 'text' ? 'bg-blue-100 text-blue-800' :
                            log.querySource === 'voice' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {log.querySource === 'text' ? 'Text' : 
                             log.querySource === 'voice' ? 'Voice' : 'Suggestion'}
                          </span>
                          <span className="ml-2">{log.responseTime} ms</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.intentType === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {log.intentType}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.response}
                        </div>
                        {log.feedback && (
                          <div className="text-xs mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.feedback.isHelpful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.feedback.isHelpful ? 'Hữu ích' : 'Không hữu ích'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="px-3 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstLog + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastLog, filteredLogs.length)}</span> của <span className="font-medium">{filteredLogs.length}</span> hội thoại
                </div>
                <nav className="flex items-center">
                  <button
                    onClick={() => setCurrentLogPage(currentLogPage - 1)}
                    disabled={currentLogPage === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="mx-2 text-sm text-gray-700">
                    Trang {currentLogPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentLogPage(currentLogPage + 1)}
                    disabled={currentLogPage === totalPages}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intents Tab */}
      {activeTab === 'intents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Intent Management</h2>
            <button
              onClick={handleIntentCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm Intent mới
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên Intent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mô tả
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Câu hỏi mẫu
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Phản hồi mẫu
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockIntents.map((intent) => (
                    <tr key={intent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{intent.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{intent.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900">{intent.trainingPhrases.length}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900">{intent.responses.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          intent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {intent.isActive ? 'Kích hoạt' : 'Đã tắt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleIntentEdit(intent)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Cài đặt AI</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-4">Cài đặt chung</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Kích hoạt trợ lý AI</h4>
                      <p className="text-sm text-gray-500">Cho phép hiển thị trợ lý AI trên trang web</p>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0"
                        id="toggle-ai-assistant"
                        defaultChecked
                      />
                      <label 
                        htmlFor="toggle-ai-assistant"
                        className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Cho phép nhập bằng giọng nói</h4>
                      <p className="text-sm text-gray-500">Cho phép người dùng nói chuyện với trợ lý qua micro</p>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0"
                        id="toggle-voice-input"
                        defaultChecked
                      />
                      <label 
                        htmlFor="toggle-voice-input"
                        className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Tự động hiện trợ lý</h4>
                      <p className="text-sm text-gray-500">Tự động hiện trợ lý khi khách vào trang</p>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0"
                        id="toggle-auto-show"
                      />
                      <label 
                        htmlFor="toggle-auto-show"
                        className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Hiện gợi ý trò chuyện</h4>
                      <p className="text-sm text-gray-500">Hiển thị gợi ý chat để người dùng bắt đầu trò chuyện</p>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0"
                        id="toggle-suggestions"
                        defaultChecked
                      />
                      <label 
                        htmlFor="toggle-suggestions"
                        className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                      ></label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-800 mb-4">Cài đặt nâng cao</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="model-version" className="block text-sm font-medium text-gray-700">
                      Phiên bản mô hình
                    </label>
                    <select
                      id="model-version"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      defaultValue="gpt4"
                    >
                      <option value="gpt4">GPT-4 (Recommended)</option>
                      <option value="gpt3.5">GPT-3.5 Turbo</option>
                      <option value="custom">Custom Model</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                      Temperature (0-1)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      id="temperature"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Ổn định hơn</span>
                      <span>Sáng tạo hơn</span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700">
                      Độ dài tối đa (tokens)
                    </label>
                    <input
                      type="number"
                      id="max-tokens"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      defaultValue="1024"
                      min="256"
                      max="4096"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <input
                      type="password"
                      id="api-key"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="sk-..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Để trống để sử dụng API key mặc định của hệ thống
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-800 mb-4">Kết nối Database</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Kết nối với sản phẩm</h4>
                        <p className="text-sm text-gray-500">Cho phép trợ lý tìm kiếm và cập nhật thông tin sản phẩm</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0"
                          id="toggle-product-db"
                          defaultChecked
                        />
                        <label 
                          htmlFor="toggle-product-db"
                          className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Kết nối với đơn hàng</h4>
                        <p className="text-sm text-gray-500">Cho phép trợ lý tìm kiếm thông tin đơn hàng</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0"
                          id="toggle-order-db"
                          defaultChecked
                        />
                        <label 
                          htmlFor="toggle-order-db"
                          className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Kết nối với công thức nấu ăn</h4>
                        <p className="text-sm text-gray-500">Cho phép trợ lý tìm kiếm công thức nấu ăn</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0"
                          id="toggle-recipe-db"
                          defaultChecked
                        />
                        <label 
                          htmlFor="toggle-recipe-db"
                          className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Kết nối với khách hàng</h4>
                        <p className="text-sm text-gray-500">Cho phép trợ lý tìm kiếm thông tin khách hàng (cẩn trọng)</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0"
                          id="toggle-customer-db"
                        />
                        <label 
                          htmlFor="toggle-customer-db"
                          className="slider block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-all before:duration-300 checked:before:translate-x-6 checked:bg-indigo-600"
                        ></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Đặt lại mặc định
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intent Modal */}
      {showIntentModal && selectedIntent && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedIntent.id.includes('intent-') ? 'Thêm Intent mới' : 'Cập nhật Intent'}
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="intent-name" className="block text-sm font-medium text-gray-700">
                          Tên Intent <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="intent-name"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={selectedIntent.name}
                          onChange={(e) => setSelectedIntent({...selectedIntent, name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="intent-description" className="block text-sm font-medium text-gray-700">
                          Mô tả
                        </label>
                        <input
                          type="text"
                          id="intent-description"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={selectedIntent.description}
                          onChange={(e) => setSelectedIntent({...selectedIntent, description: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Câu hỏi mẫu
                        </label>
                        <div className="mt-1 space-y-2">
                          {selectedIntent.trainingPhrases.map((phrase, index) => (
                            <div key={index} className="flex">
                              <input
                                type="text"
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={phrase}
                                onChange={(e) => {
                                  const newPhrases = [...selectedIntent.trainingPhrases];
                                  newPhrases[index] = e.target.value;
                                  setSelectedIntent({...selectedIntent, trainingPhrases: newPhrases});
                                }}
                              />
                              <button
                                type="button"
                                className="ml-2 text-red-600 hover:text-red-900"
                                onClick={() => {
                                  const newPhrases = selectedIntent.trainingPhrases.filter((_, i) => i !== index);
                                  setSelectedIntent({...selectedIntent, trainingPhrases: newPhrases});
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => {
                              setSelectedIntent({
                                ...selectedIntent, 
                                trainingPhrases: [...selectedIntent.trainingPhrases, '']
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm câu hỏi
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phản hồi mẫu
                        </label>
                        <div className="mt-1 space-y-2">
                          {selectedIntent.responses.map((response, index) => (
                            <div key={index} className="flex">
                              <textarea
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={response}
                                rows={2}
                                onChange={(e) => {
                                  const newResponses = [...selectedIntent.responses];
                                  newResponses[index] = e.target.value;
                                  setSelectedIntent({...selectedIntent, responses: newResponses});
                                }}
                              />
                              <button
                                type="button"
                                className="ml-2 text-red-600 hover:text-red-900"
                                onClick={() => {
                                  const newResponses = selectedIntent.responses.filter((_, i) => i !== index);
                                  setSelectedIntent({...selectedIntent, responses: newResponses});
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => {
                              setSelectedIntent({
                                ...selectedIntent, 
                                responses: [...selectedIntent.responses, '']
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm phản hồi
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="intent-active"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedIntent.isActive}
                          onChange={(e) => setSelectedIntent({...selectedIntent, isActive: e.target.checked})}
                        />
                        <label htmlFor="intent-active" className="ml-2 block text-sm text-gray-900">
                          Kích hoạt intent này
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowIntentModal(false)}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowIntentModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for toggle switches */}
      <style jsx>{`
        input:checked + .slider {
          background-color: #4f46e5;
        }
        
        input:checked + .slider:before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  );
};

export default AIAssistantManagement;
