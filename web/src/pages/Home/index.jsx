/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Typography,
} from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconBolt,
  IconShield,
  IconGlobe,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';


const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };


  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);


  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-transparent to-[rgba(var(--semi-grey-0),0.05)]'>
          {/* 背景装饰 */}
          <div className='absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none' />
          <div className='absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none' />

          <div className='z-10 flex flex-col items-center text-center px-4 max-w-6xl mx-auto mt-16 md:mt-24 mb-20'>
            {/* 标题区域 */}
            <div className='mb-10 mt-16'>
              <h1 className='text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 pb-4 leading-tight tracking-tight'>
                {t('一个网关，链接所有智能')}
              </h1>
              <p className='text-lg md:text-2xl text-semi-color-text-1 mt-6 max-w-3xl mx-auto font-light leading-relaxed'>
                {t('统一接口，无限可能。连接全球顶尖大模型，赋能您的 AI 应用。')}
              </p>
            </div>

            {/* 按钮组 */}
            <div className='flex flex-row gap-6 justify-center items-center mb-20'>
              <Link to='/console'>
                <Button
                  theme='solid'
                  type='primary'
                  size='large'
                  className='!rounded-full !px-10 !py-6 !text-lg !font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform'
                  icon={<IconPlay />}
                >
                  {t('立即开始')}
                </Button>
              </Link>
              {isDemoSiteMode && statusState?.status?.version ? (
                <Button
                  size='large'
                  className='!rounded-full !px-8 !py-6 !text-lg !font-medium border-semi-color-border hover:bg-semi-color-bg-2 transition-all'
                  icon={<IconGithubLogo />}
                  onClick={() =>
                    window.open(
                      'https://github.com/QuantumNous/new-api',
                      '_blank',
                    )
                  }
                >
                  GitHub
                </Button>
              ) : (
                docsLink && (
                  <Button
                    size='large'
                    className='!rounded-full !px-8 !py-6 !text-lg !font-medium border-semi-color-border hover:bg-semi-color-bg-2 transition-all'
                    icon={<IconFile />}
                    onClick={() => window.open(docsLink, '_blank')}
                  >
                    {t('开发文档')}
                  </Button>
                )
              )}
            </div>


            {/* 特性亮点 */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mx-auto mb-8'>
              <div className='flex flex-col items-center text-center p-6 bg-semi-color-bg-2 rounded-2xl border border-semi-color-border shadow-sm transition-all'>
                <div className='w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2'>
                  <IconBolt size='large' />
                </div>
                <h3 className='text-lg font-bold text-semi-color-text-0 mb-2'>{t('极速响应')}</h3>
                <p className='text-semi-color-text-2'>{t('高性能加速网络，提供流畅的对话体验')}</p>
              </div>
              <div className='flex flex-col items-center text-center p-6 bg-semi-color-bg-2 rounded-2xl border border-semi-color-border shadow-sm transition-all'>
                <div className='w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-2'>
                  <IconShield size='large' />
                </div>
                <h3 className='text-lg font-bold text-semi-color-text-0 mb-2'>{t('安全稳定')}</h3>
                <p className='text-semi-color-text-2'>{t('企业级安全防护，99.9% 在线率，保障业务连续性')}</p>
              </div>
              <div className='flex flex-col items-center text-center p-6 bg-semi-color-bg-2 rounded-2xl border border-semi-color-border shadow-sm transition-all'>
                <div className='w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2'>
                  <IconGlobe size='large' />
                </div>
                <h3 className='text-lg font-bold text-semi-color-text-0 mb-2'>{t('全球模型')}</h3>
                <p className='text-semi-color-text-2'>{t('一站式接入全球主流大模型，打破地域限制')}</p>
              </div>
            </div>

            {/* 模型图标网格 */}
            <div className='w-full max-w-5xl'>
              <div className='flex items-center justify-center mb-10'>
                <div className='h-[1px] w-16 bg-gradient-to-r from-transparent to-semi-color-border'></div>
                <span className='mx-4 text-semi-color-text-2 font-medium uppercase tracking-widest'>
                  {t('支持全球主流大模型提供商服务')}
                </span>
                <div className='h-[1px] w-16 bg-gradient-to-l from-transparent to-semi-color-border'></div>
              </div>

              <div className='grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-3 gap-6 md:gap-16 justify-items-center opacity-80 hover:opacity-100 transition-opacity duration-500'>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Gemini.Combine size={36} type='color'/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <OpenAI.Combine size={36} />
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Claude.Combine size={36} type='color'/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <XAI.Combine size={36} />
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Moonshot.Combine size={36}/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <DeepSeek.Combine size={36} type='color'/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Minimax.Combine size={36} type='color'/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Qwen.Combine size={36} type='color'/>
                </div>
                <div className='flex items-center justify-center transition-transform hover:scale-110'>
                  <Typography.Text className='text-lg font-medium'>More...</Typography.Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
