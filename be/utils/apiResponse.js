// utils/apiResponse.js
/**
 * Lớp xử lý phản hồi API chuẩn
 */
class ApiResponse {
    /**
     * Phản hồi thành công
     */
    static success(res, data = null, message = null, statusCode = 200) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    /**
     * Phản hồi thành công khi tạo mới
     */
    static created(res, data = null, message = 'Tạo thành công', statusCode = 201) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    /**
     * Phản hồi lỗi
     */
    static error(res, message = 'Lỗi máy chủ', statusCode = 500) {
      return res.status(statusCode).json({
        success: false,
        message,
        data: null
      });
    }
  }
  
  module.exports = ApiResponse;