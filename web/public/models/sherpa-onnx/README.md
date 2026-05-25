# Thư mục Model Sherpa-ONNX

Để sử dụng tính năng nhận diện giọng nói Realtime Offline, bạn cần tải về các tệp mô hình và đặt chúng vào thư mục này.

## Danh sách tệp tin yêu cầu

1. `tokens.txt` (Từ điển nhãn ký tự)
2. `encoder.onnx` (Bộ mã hóa âm thanh ONNX)
3. `decoder.onnx` (Bộ giải mã text ONNX)
4. `joiner.onnx` (Bộ ghép nối/dự đoán ONNX)

## Khuyến nghị mô hình

Nên sử dụng mô hình **Zipformer** phiên bản tiếng Anh gọn nhẹ chạy tốt trong trình duyệt (ví dụ: `sherpa-onnx-streaming-zipformer-en-2023-06-26`):

- **Link download chính thức**: [k2-fsa sherpa-onnx models release](https://github.com/k2-fsa/sherpa-onnx/releases) hoặc [huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26](https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26/tree/main)

Tải các tệp sau và đổi tên/đặt vào đúng vị trí:
- `tokens.txt`
- `encoder-epoch-99-img-512-x-2048.onnx` -> `encoder.onnx`
- `decoder-epoch-99-img-512-x-2048.onnx` -> `decoder.onnx`
- `joiner-epoch-99-img-512-x-2048.onnx` -> `joiner.onnx`

## Ghi chú
Nếu chưa có các tệp mô hình này, vui lòng bật chế độ **Mock Realtime** hoặc **Whisper Batch** trong phần cài đặt của giao diện luyện nói để tiếp tục chạy thử nghiệm và phát triển ứng dụng.
