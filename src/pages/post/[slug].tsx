import Head from 'next/head';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { useRouter } from 'next/router';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const timeToRead = post.data.content.reduce((time: number, content) => {
    const words = RichText.asText(content.body).split(' ').length;
    time += Math.ceil(words / 200);
    return time;
  }, 0);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={commonStyles.container}>
      <Head>
        <title>{post.data.title} | spacetraveling.</title>
      </Head>

      <Header />

      <main className={styles.post}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>

        <h1>{post.data.title}</h1>

        <div className={commonStyles.info}>
          <time>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'd LLL YYY', {
              locale: ptBR,
            })}
          </time>
          <span>
            <FiUser />
            {post.data.author}
          </span>
          <span>
            <FiClock />
            {timeToRead} min
          </span>
        </div>

        {post.data.content.map((content, index) => {
          return (
            <section key={index}>
              <h2>{content.heading}</h2>
              <div className={styles.content}>
                {content.body.map((body, index) => (
                  <p
                    key={index}
                    dangerouslySetInnerHTML={{ __html: body.text }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: { slug: post.uid },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});
  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: body.text,
              type: body.type,
              spans:
                body.spans.length > 0
                  ? body.spans.map(span => {
                      return span.data
                        ? {
                            start: span.start,
                            end: span.end,
                            type: span.type,
                            data: span.data,
                          }
                        : {
                            start: span.start,
                            end: span.end,
                            type: span.type,
                          };
                    })
                  : [],
            };
          }),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30,
  };
};
