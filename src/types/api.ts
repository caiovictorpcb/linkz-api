export interface CreateUserUrlPayload {
    alias: string;
    full_url: string;
    shortened_url: string;
    user_ip: string;
  }
  
  export interface ShortUrlBody {
    url: string;
  }