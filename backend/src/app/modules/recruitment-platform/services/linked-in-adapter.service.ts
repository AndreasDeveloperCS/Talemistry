import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { BlogPost } from '../../blog/models/blog-post';
import { LinkedInSessionService } from './linkedin-session.service';
import { LinkedInSessionToken } from '../models/linkedin-session-token';
import { LinkedInUser } from '../../auth/models/linkedin-user';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'typeorm';

@Injectable()
export class LinkedInAdapterService {
  private accessTokenLinkedIn = 'https://www.linkedin.com/oauth/v2/accessToken';
  private clientId = process.env.LINKEDIN_CLIENT_ID;
  private clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  private redirectUri = 'http://localhost:4200/career/recruitment-platforms/linkedin-blogs';
  private apiUrl = 'https://api.linkedin.com/v2';
  private imageUpload = 'https://api.linkedin.com/v2/assets?action=registerUpload';
  private tokenSession: LinkedInSessionToken;
  private maxTextLength = 3000;
  private reservedCharacters = 30;
  private blogUrl = 'https://evryka.org/blog/posts/';

  constructor(private http: HttpService,
     private readonly jwtService: JwtService,
     private linkedinSessionService: LinkedInSessionService) {
  }

  async getAccessToken(body: { userId: any, code: any }): Promise<any> {
    const { userId, code } = body;

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const { data } = await firstValueFrom(this.http.post(this.accessTokenLinkedIn, params));
      return data;
    } catch (error) {
      console.error('Error fetching access token:', error.response?.data || error.message);
    }
  }

  async decodeIdToken(idToken: string): Promise<any> {
    const decodedToken = this.jwtService.decode(idToken);
    return decodedToken;
  }

  async createSessionToken(token: any, user: LinkedInUser, userId: any): Promise<LinkedInSessionToken> {
    try {
      this.tokenSession = {
        userId: userId,
        access_token: token.access_token || '',
        refresh_token: token.refresh_token || '',
        expires_in: token.expires_in || 0,
        refresh_token_expires_in: token.refresh_token_expires_in || 0,
        scope: token.scope || '',
        token_type: token.token_type || '',
        id_token: token.id_token || '',
        user_sub: user.sub || '',
        createdBy: userId,
        createdDate: new Date(),
        isValid: true,
      };
      await this.linkedinSessionService.saveLinkedInSessionTokenAsync(this.tokenSession);
      return this.tokenSession;
    } catch (error) {
      console.error('Error saving LinkedIn session token');
    }
  }

  async postArticle(body: {
    userId: any,
    article: BlogPost
  }): Promise<any> {
    try {
      console.log("LinkedIn Adapter postArticle", body);
      const { userId, article } = body;

      let tokenSession: LinkedInSessionToken = await this.linkedinSessionService.getLinkedInSessionTokenAsync(userId);
      if (!tokenSession) {
        throw new UnauthorizedException('Token session is missing or invalid');
      }
      const dateTimeIssued = tokenSession?.modifiedDate ?? tokenSession.createdDate;
      if (tokenSession == undefined) {
        throw new UnauthorizedException('Token session is missing or invalid');
      }
      const decodedToken = this.jwtService.decode(tokenSession.id_token);
      const activeExpiresAt = dateTimeIssued.getTime() / 1000 + tokenSession.expires_in;
      const refreshExpiresAt = dateTimeIssued.getTime() / 1000 + tokenSession.refresh_token_expires_in;

      const isExpired = activeExpiresAt < Math.floor(Date.now() / 1000);
      const isRefreshExpired = refreshExpiresAt < Math.floor(Date.now() / 1000);

      if (isExpired && isRefreshExpired) {
        throw new UnauthorizedException('Token session has expired');
      }

      if (isExpired && !isRefreshExpired) {
        // if (true) {
        const refreshedTokenData = await this.refreshAccessToken(tokenSession.refresh_token);
        tokenSession = await this.linkedinSessionService.refreshToken(tokenSession, refreshedTokenData);
      }

      if (tokenSession) {
        const accessToken = tokenSession.access_token;
        const urn = tokenSession.user_sub;
        console.log('urn', urn);
        const link = `${this.blogUrl}${article._id}`;
        console.log('link', link);

        const url = `${this.apiUrl}/ugcPosts`;
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        };

        const imageUrl = article?.images[0];
        console.log('imageUrl', imageUrl);
        const { uploadUrl, assetUrn } = await this.registerImageUpload(accessToken, tokenSession.user_sub);
        console.log('{ uploadUrl, assetUrn }', { uploadUrl, assetUrn });
        await this.uploadImageToLinkedIn(uploadUrl, imageUrl.imagePath);

        const hashtags = article.hashtags.map((tag) => `#${tag}`).join('; ');

        const availableContentLength = this.maxTextLength - (article.title.length + link.length + hashtags.length + this.reservedCharacters);

        const postBody = {
          author: `urn:li:person:${urn}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: `${article.title}\n\n${this.formatLinkedInText(article.content.substring(0, availableContentLength))} ...\n\nRead more: https://evryka.org/blog \r\n ${link}\n\n${hashtags}`
              },
              title: article.title,
              shareMediaCategory: "RICH",// 'ARTICLE',
              originalUrl: link,
              media: [{
                status: 'READY',
                media: assetUrn,
                //originalUrl: link,
                description: {
                  text: `EVRYKA` + ` href="${link}"`
                },
                title: {
                  text: "EVRYKA"
                }
              }],
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        };
        console.log('postBody', postBody);
        const response = await axios.post(url, postBody, { headers });
        console.log('Article posted successfully:', response.status);
        //const result = await this.postBlogOnLinkedIn(accessToken, urn);
        return {
          status: response.status,
          data: response.data
        };
      }
      else {
        console.log("No LinkedIn session token found");
      }
    } catch (error) {
      console.error('Error posting LinkedIn blog', error);
      throw error;
    }
  }

  async registerImageUpload(accessToken: string, userUrn: string) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    };

    const body = {
      registerUploadRequest: {
        owner: `urn:li:person:${userUrn}`,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
      }
    };

    const response = await this.http.axiosRef.post(
      this.imageUpload,
      body,
      { headers }
    );

    const uploadUrl = response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = response.data.value.asset;

    return { uploadUrl, assetUrn };
  }

  async uploadImageToLinkedIn(uploadUrl: string, imageUrl: string) {
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    const imageBuffer = imageResponse.data;
    const mimeType = imageResponse.headers['content-type'];

    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length
      }
    });
  }

  formatLinkedInText(input: string): string {
    return input
      .replace(/<\/?p>/g, "\n")
      .replace(/<\/?br>/g, "\r\n")

      .replace(/<\/?strong>/g, "**")
      .replace(/<\/?b>/g, "**")

      .replace(/<\/?em>/g, "*")
      .replace(/<\/?i>/g, "*")

      .replace(/<\/?ul>/g, "\r\n")
      .replace(/<\/?ol>/g, "\r\n")

      .replace(/<\/?li>/g, "\n• ")

      .replace(/&nbsp;/g, " ")

      .replace(/·\s+/g, "• ")
      .replace(/&ldquo;|&rdquo;/g, '"')

      .replace(/<img[^>]*>/g, "")

      .replace(/<\/?[^>]+(>|$)/g, "")

      .trim();
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    try {
      const response = await firstValueFrom(
        this.http.post(this.accessTokenLinkedIn, params.toString(), { headers })
      );
      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh LinkedIn access token');
    }
  }

  // simpleJobPostings, w_jobs - required scope
  // async postJob(accessToken: string, jobData: any) {
  //   const url = 'https://api.linkedin.com/rest/simpleJobPostings';
  //   const headers = {
  //       Authorization: `Bearer ${accessToken}`,
  //       'X-Restli-Protocol-Version': '2.0.0',
  //       'Content-Type': 'application/json',
  //   };

  //   const postBody = {
  //       company: `urn:li:organization:${jobData.companyId}`,
  //       title: jobData.title,
  //       description: jobData.description,
  //       location: jobData.location,
  //       employmentType: jobData.employmentType,
  //       applyMethod: {
  //           type: "EXTERNAL_URL",
  //           url: jobData.url,
  //       },
  //   };

  //   const response = await axios.post(url, postBody, { headers });
  //   return response.data;
  // }

  //ugcPosts - only post job announcements as a regular post (like your original method)
  // async postJob(accessToken: string, jobData: any) {
  //     const url = `${this.apiUrl}/ugcPosts`;
  //     const headers = {
  //         Authorization: `Bearer ${accessToken}`,
  //         'X-Restli-Protocol-Version': '2.0.0',
  //         'Content-Type': 'application/json',
  //     };

  //     const postBody = {
  //         author: 'urn:li:person:YOUR_PERSON_URN',
  //         lifecycleState: 'PUBLISHED',
  //         specificContent: {
  //             'com.linkedin.ugc.ShareContent': {
  //                 shareCommentary: {
  //                     text: `We're hiring! 🚀\n\n${jobData.title}\nLocation: ${jobData.location}\nApply here: ${jobData.url}`,
  //                 },
  //                 shareMediaCategory: 'NONE',
  //             },
  //         },
  //         visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  //     };

  //     const response = await axios.post(url, postBody, { headers });
  //     return response.data;
  // }


  async postJobOnLinkedIn(accessToken: string, companyUrn: string) {
    try {
      const apiUrl = 'https://api.linkedin.com/v2/jobsPosting';

      const jobPostData = {
        author: companyUrn,
        title: "Sales Manager",
        description: "Evryka - Digital Innovative Solutions is a leading IT outsource service provider specializing in software development and business digital transformation. Our expertise spans Artificial Intelligence, Data Science, Big Data, Custom Software Development, and Mobile Development. Utilizing advanced technologies such as Python, C#/.NET, MEAN, MERN, Java, and PHP, Evryka delivers cutting-edge solutions across various industries including Healthcare, Finance, Retail, and more. Our goal is to enhance the operational efficiency and growth of businesses through innovative digital solutions.",
        jobPostingOperation: {
          commit: {
            jobPosting: {
              title: "Sales Manager",
              description: "This is a full-time remote role for a Sales Manager. The Sales Manager will be responsible for identifying and developing new business opportunities, managing client relationships, and driving revenue growth. Daily tasks include conducting market research, creating sales strategies, leading negotiations, and coordinating with the marketing and technical teams to deliver tailored solutions to clients. Additionally, the Sales Manager will be tasked with preparing sales reports and analyzing performance metrics to ensure targets are met.",
              jobLocation: {
                countryCode: "GR",
                postalCode: "10437",
                city: "Athens",
              },
              jobFunctions: ["urn:li:jobFunction:3"],
              employmentType: "urn:li:employmentType:F",
              companyDescription: `Strong background in Sales, Business Development, and Customer Relationship Management (CRM)
                                    Experience in market research, creating sales strategies, and leading negotiations
                                    Proficiency in preparing sales reports and analyzing performance metrics
                                    Excellent interpersonal and communication skills
                                    Ability to work independently and remotely
                                    Experience in the IT or software development industry is a plus
                                    Bachelor's degree in Business, Marketing, or a related field.
                                    
                                    We suggest a remote format of interaction with daily standup meetings.

                                    Progressive commission-based cooperation approach, based on results and achievements.

                                    Start a career in IT and send your CV with a short Cover Letter as a motivational story about your goals and your current achievements.

                                    We are glad to welcome motivated and ambitious talents to join our team!`,
              workRemoteAllowed: true,
            }
          }
        }
      };

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      };

      const response = await axios.post(apiUrl, jobPostData, { headers });

      // console.log('Job posted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error posting job:', error.response?.data || error.message);
      throw new Error('Failed to post job on LinkedIn');
    }
  }

  async postBlogOnLinkedIn(accessToken: string, urn: string) {
    try {
      const url = "https://evryka.org/blog/6771d5e58c56f9df76d7ed4b";
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${urn}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: `🚀 Check out my latest blog post on Angular development! <a href="${url}"/>`
              },
              shareMediaCategory: "ARTICLE",
              media: [
                {
                  status: "READY",
                  originalUrl: `https://call-centers-ai-tool.evryka.org/report/file-info/a0ea7620-87be-4b21-bfb4-99a31381f44b`,
                  title: {
                    text: "My Latest Blog on Angular"
                  }
                }
              ]
            }
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
          }
        }
      );

      // console.log("Blog posted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error posting blog:", error.response?.data || error.message);
      throw new Error("Failed to post blog on LinkedIn");
    }
  }

  async getPublishedPosts(accessToken: string, urn: string) {
    const url = `${this.apiUrl}/ugcPosts?q=authors&authors=List(urn:li:person:${urn})`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.http.get(url, { headers })
      );
      return response.data.elements;
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error.response?.data, error.message);
      throw new Error('Failed to fetch LinkedIn posts');
    }
  }
}
