import * as HoverCard from '@radix-ui/react-hover-card'
import { styled } from '@stitches/react'
import { useRouter } from 'next/router'
import { useMemo, useState, useCallback } from 'react'
import { Button } from '../../components/elements/Button'
import { AddToLibraryActionIcon } from '../../components/elements/icons/home/AddToLibraryActionIcon'
import { ArchiveActionIcon } from '../../components/elements/icons/home/ArchiveActionIcon'
import { CommentActionIcon } from '../../components/elements/icons/home/CommentActionIcon'
import { RemoveActionIcon } from '../../components/elements/icons/home/RemoveActionIcon'
import { ShareActionIcon } from '../../components/elements/icons/home/ShareActionIcon'
import Pagination from '../../components/elements/Pagination'
import { timeAgo } from '../../components/patterns/LibraryCards/LibraryCardStyles'
import { theme } from '../../components/tokens/stitches.config'
import { useApplyLocalTheme } from '../../lib/hooks/useApplyLocalTheme'
import { useGetHiddenHomeSection } from '../../lib/networking/queries/useGetHiddenHomeSection'
import {
  HomeItem,
  HomeItemSource,
  HomeItemSourceType,
  HomeSection,
  useGetHomeItems,
} from '../../lib/networking/queries/useGetHome'
import {
  SubscriptionType,
  useGetSubscriptionsQuery,
} from '../../lib/networking/queries/useGetSubscriptionsQuery'
import {
  HStack,
  SpanBox,
  VStack,
} from './../../components/elements/LayoutPrimitives'
import { ThumbsDown, ThumbsUp } from 'phosphor-react'
import {
  SendHomeFeedbackType,
  SendHomeFeedbackInput,
  sendHomeFeedbackMutation,
} from '../../lib/networking/mutations/updateHomeFeedbackMutation'
import { showErrorToast, showSuccessToast } from '../../lib/toastHelpers'
import { Toaster } from 'react-hot-toast'
import { useGetSubscriptionQuery } from '../../lib/networking/queries/useGetSubscription'

export default function Home(): JSX.Element {
  const homeData = useGetHomeItems()
  console.log('home sections: ', homeData.sections)
  useApplyLocalTheme()

  return (
    <VStack
      distribution="start"
      alignment="center"
      css={{
        width: '100%',
        bg: '$readerBg',
        pt: '45px',
        minHeight: '100vh',
      }}
    >
      <Toaster />
      <VStack
        distribution="start"
        css={{
          width: '646px',
          gap: '40px',
          minHeight: '100vh',
          '@mdDown': {
            width: '100%',
          },
        }}
      >
        {homeData.sections?.map((homeSection, idx) => {
          switch (homeSection.layout) {
            case 'just_added':
              return (
                <JustAddedHomeSection
                  key={`section-${idx}`}
                  homeSection={homeSection}
                />
              )
            case 'top_picks':
              return (
                <TopPicksHomeSection
                  key={`section-${idx}`}
                  homeSection={homeSection}
                />
              )
            case 'quick_links':
              return (
                <QuickLinksHomeSection
                  key={`section-${idx}`}
                  homeSection={homeSection}
                />
              )
            case 'hidden':
              return (
                <HiddenHomeSection
                  key={`section-${idx}`}
                  homeSection={homeSection}
                />
              )
            default:
              return <></>
          }
        })}
      </VStack>
    </VStack>
  )
}

type HomeSectionProps = {
  homeSection: HomeSection
}

const JustAddedHomeSection = (props: HomeSectionProps): JSX.Element => {
  return (
    <VStack
      distribution="start"
      css={{
        width: '100%',
        gap: '20px',
      }}
    >
      <SpanBox
        css={{
          fontFamily: '$inter',
          fontSize: '16px',
          fontWeight: '600',
          color: '$readerText',
        }}
      >
        {props.homeSection.title}
      </SpanBox>

      {props.homeSection.items.map((homeItem) => {
        return <JustAddedItemView key={homeItem.id} homeItem={homeItem} />
      })}
    </VStack>
  )
}

const TopPicksHomeSection = (props: HomeSectionProps): JSX.Element => {
  return (
    <VStack
      distribution="start"
      css={{
        width: '100%',
        gap: '20px',
      }}
    >
      <SpanBox
        css={{
          fontFamily: '$inter',
          fontSize: '16px',
          fontWeight: '600',
          color: '$readerText',
        }}
      >
        {props.homeSection.title}
      </SpanBox>

      <Pagination
        items={props.homeSection.items}
        itemsPerPage={4}
        render={(homeItem) => (
          <TopicPickHomeItemView key={homeItem.id} homeItem={homeItem} />
        )}
      />
    </VStack>
  )
}

const QuickLinksHomeSection = (props: HomeSectionProps): JSX.Element => {
  return (
    <VStack
      distribution="start"
      css={{
        width: '100%',
        gap: '20px',
      }}
    >
      <SpanBox
        css={{
          fontFamily: '$inter',
          fontSize: '16px',
          fontWeight: '600',
          color: '$readerText',
        }}
      >
        {props.homeSection.title}
      </SpanBox>

      <Pagination
        items={props.homeSection.items}
        itemsPerPage={8}
        render={(homeItem) => (
          <QuickLinkHomeItemView key={homeItem.id} homeItem={homeItem} />
        )}
      />
    </VStack>
  )
}

const HiddenHomeSection = (props: HomeSectionProps): JSX.Element => {
  const [isHidden, setIsHidden] = useState(true)
  return (
    <VStack
      distribution="start"
      css={{
        width: '100%',
        gap: '20px',
        marginBottom: '40px',
      }}
    >
      <HStack
        distribution="start"
        alignment="center"
        css={{
          gap: '10px',
          cursor: 'pointer',
        }}
        onClick={() => setIsHidden(!isHidden)}
      >
        <SpanBox
          css={{
            fontFamily: '$inter',
            fontSize: '16px',
            fontWeight: '600',
            color: '$readerText',
          }}
        >
          {props.homeSection.title}
        </SpanBox>
        <SpanBox
          css={{
            fontFamily: '$inter',
            fontSize: '13px',
            color: '$readerFont',
          }}
        >
          {isHidden ? 'Show' : 'Hide'}
        </SpanBox>
      </HStack>

      {isHidden ? <></> : <HiddenHomeSectionView />}
    </VStack>
  )
}

const HiddenHomeSectionView = (): JSX.Element => {
  const hiddenSectionData = useGetHiddenHomeSection()

  if (hiddenSectionData.error) {
    return <SpanBox>Error loading hidden section</SpanBox>
  }

  if (hiddenSectionData.isValidating) {
    return <SpanBox>Loading...</SpanBox>
  }

  if (!hiddenSectionData.section) {
    return <SpanBox>No hidden section data</SpanBox>
  }

  return (
    <VStack
      distribution="start"
      css={{
        width: '100%',
      }}
    >
      {hiddenSectionData.section.items.map((homeItem) => {
        return <QuickLinkHomeItemView key={homeItem.id} homeItem={homeItem} />
      })}
    </VStack>
  )
}

const CoverImage = styled('img', {
  objectFit: 'cover',
})

type HomeItemViewProps = {
  homeItem: HomeItem
}

const TimeAgo = (props: HomeItemViewProps): JSX.Element => {
  return (
    <HStack
      distribution="start"
      alignment="center"
      css={{
        fontSize: '12px',
        fontWeight: 'normal',
        fontFamily: '$inter',
        color: '$readerContrast',
      }}
    >
      {timeAgo(props.homeItem.date)}
    </HStack>
  )
}

const Title = (props: HomeItemViewProps): JSX.Element => {
  return (
    <HStack
      distribution="start"
      alignment="center"
      css={{
        fontSize: '16px',
        lineHeight: '20px',
        fontWeight: '600',
        fontFamily: '$inter',
        color: '$readerText',
      }}
    >
      {props.homeItem.title}
    </HStack>
  )
}

const JustAddedItemView = (props: HomeItemViewProps): JSX.Element => {
  const router = useRouter()

  return (
    <VStack
      css={{
        width: '100%',
        padding: '5px',
        borderRadius: '5px',
        '&:hover': {
          bg: '$thBackground',
          borderRadius: '0px',
        },
      }}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          window.open(props.homeItem.url, '_blank')
        } else {
          router.push(props.homeItem.url)
        }
      }}
    >
      <HStack
        distribution="start"
        alignment="center"
        css={{ gap: '5px', lineHeight: '1' }}
      >
        <SourceInfo homeItem={props.homeItem} />
        <TimeAgo homeItem={props.homeItem} />
      </HStack>
      <Title homeItem={props.homeItem} />
    </VStack>
  )
}

const TopicPickHomeItemView = (props: HomeItemViewProps): JSX.Element => {
  const router = useRouter()

  return (
    <VStack
      css={{
        width: '100%',
        padding: '20px',
        borderRadius: '5px',
        '&:hover': {
          bg: '$thBackground',
          borderRadius: '0px',
        },
      }}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          window.open(`/me/${props.homeItem.slug}`)
        } else {
          router.push(`/me/${props.homeItem.slug}`)
        }
      }}
    >
      <HStack css={{ width: '100%', gap: '5px' }}>
        <VStack css={{ gap: '15px' }}>
          <HStack
            distribution="start"
            alignment="center"
            css={{ gap: '5px', lineHeight: '1' }}
          >
            <SourceInfo homeItem={props.homeItem} />
            <TimeAgo homeItem={props.homeItem} />
          </HStack>
          <Title homeItem={props.homeItem} />
        </VStack>
        <SpanBox css={{ ml: 'auto' }}>
          {props.homeItem.thumbnail && (
            <CoverImage
              css={{
                mt: '6px',
                width: '120px',
                height: '70px',
                borderRadius: '4px',
              }}
              src={props.homeItem.thumbnail}
            ></CoverImage>
          )}
        </SpanBox>
      </HStack>
      <SpanBox
        css={{ fontFamily: '$inter', fontSize: '13px', lineHeight: '23px' }}
      >
        {props.homeItem.previewContent}
      </SpanBox>
      <HStack css={{ gap: '6px', mt: '20px' }}>
        <Button style="ghost">
          <AddToLibraryActionIcon />
        </Button>
        <Button style="ghost">
          <CommentActionIcon />
        </Button>
        <Button style="ghost">
          <ShareActionIcon />
        </Button>
        <Button style="ghost">
          <ArchiveActionIcon />
        </Button>
        <Button style="ghost">
          <RemoveActionIcon />
        </Button>
      </HStack>
    </VStack>
  )
}

const QuickLinkHomeItemView = (props: HomeItemViewProps): JSX.Element => {
  const router = useRouter()

  return (
    <VStack
      css={{
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        '&:hover': {
          bg: '$thBackground',
          borderRadius: '0px',
        },
      }}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          window.open(props.homeItem.url, '_blank')
        } else {
          router.push(props.homeItem.url)
        }
      }}
    >
      <TimeAgo homeItem={props.homeItem} />
      <Title homeItem={props.homeItem} />
    </VStack>
  )
}

const SiteIcon = (props: {
  src: string
  alt: string
  size: 'large' | 'small'
}) => {
  const [isError, setIsError] = useState(false)
  return (
    <>
      {!isError && (
        <img
          src={props.src}
          alt={props.alt}
          style={{
            display: isError ? 'none' : 'block',
            width: props.size == 'large' ? '25px' : '16px',
            height: props.size == 'large' ? '25px' : '16px',
          }}
          onError={() => setIsError(true)}
        />
      )}
    </>
  )
}

const SourceInfo = (props: HomeItemViewProps) => {
  const renderSource = (source: HomeItemSource): JSX.Element => {
    switch (props.homeItem.source.type) {
      case 'LIBRARY':
        return <SiteSourceHoverContent source={source} />
      case 'NEWSLETTER':
      case 'RSS':
        return <SubscriptionSourceHoverContent source={source} />
    }
    return <></>
  }
  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <HStack
          distribution="start"
          alignment="center"
          css={{ gap: '5px', cursor: 'pointer' }}
        >
          {props.homeItem.source.icon && (
            <SiteIcon
              src={props.homeItem.source.icon}
              alt={props.homeItem.source.name}
              size="small"
            />
          )}
          <HStack
            css={{
              lineHeight: '1',
              fontFamily: '$inter',
              fontWeight: '500',
              fontSize: '13px',
              color: '$readerFont',
              textDecoration: 'underline',
            }}
          >
            {props.homeItem.source.name}
          </HStack>
        </HStack>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content sideOffset={5}>
          {renderSource(props.homeItem.source)}
          <HoverCard.Arrow fill={theme.colors.thBackground2.toString()} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

type SourceHoverContentProps = {
  source: HomeItemSource
}

const SubscriptionSourceHoverContent = (
  props: SourceHoverContentProps
): JSX.Element => {
  const { subscription } = useGetSubscriptionQuery(props.source.id)

  const sendHomeFeedback = useCallback(
    async (feedbackType: SendHomeFeedbackType) => {
      if (subscription) {
        const result = await sendHomeFeedbackMutation({
          feedbackType,
          subscription: subscription.name,
        })
        if (result) {
          showSuccessToast('Feedback sent')
        } else {
          showErrorToast('Error sending feedback')
        }
      } else {
        showErrorToast('Error sending feedback')
      }
    },
    [subscription]
  )

  return (
    <VStack
      alignment="start"
      distribution="start"
      css={{
        width: '380px',
        height: '200px',
        bg: '$thBackground2',
        borderRadius: '10px',
        padding: '15px',
        gap: '10px',
        boxShadow: theme.shadows.cardBoxShadow.toString(),
      }}
    >
      <HStack
        distribution="start"
        alignment="center"
        css={{ width: '100%', gap: '10px' }}
      >
        {props.source.icon && (
          <SiteIcon
            src={props.source.icon}
            alt={props.source.name}
            size="large"
          />
        )}
        <SpanBox
          css={{
            fontFamily: '$inter',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          {props.source.name}
        </SpanBox>
        <SpanBox css={{ ml: 'auto', minWidth: '100px' }}>
          {subscription && subscription.status == 'ACTIVE' && (
            <Button style="ctaSubtle" css={{ fontSize: '12px' }}>
              + Unsubscribe
            </Button>
          )}
        </SpanBox>
      </HStack>
      <SpanBox
        css={{
          fontFamily: '$inter',
          fontSize: '13px',
          color: '$thTextSubtle4',
        }}
      >
        {subscription ? <>{subscription.description}</> : <></>}
      </SpanBox>
      {subscription && <FeedbackView sendFeedback={sendHomeFeedback} />}
    </VStack>
  )
}

const SiteSourceHoverContent = (
  props: SourceHoverContentProps
): JSX.Element => {
  const sendHomeFeedback = useCallback(
    async (feedbackType: SendHomeFeedbackType) => {
      const feedback: SendHomeFeedbackInput = {
        feedbackType,
      }
      feedback.site = props.source.name
      const result = await sendHomeFeedbackMutation(feedback)
      if (result) {
        showSuccessToast('Feedback sent')
      } else {
        showErrorToast('Error sending feedback')
      }
    },
    [props]
  )

  return (
    <VStack
      alignment="start"
      distribution="start"
      css={{
        width: '240px',
        height: '100px',
        bg: '$thBackground2',
        borderRadius: '10px',
        padding: '15px',
        gap: '10px',
        boxShadow: theme.shadows.cardBoxShadow.toString(),
      }}
    >
      <HStack
        distribution="start"
        alignment="center"
        css={{ width: '100%', gap: '10px' }}
      >
        {props.source.icon && (
          <SiteIcon
            src={props.source.icon}
            alt={props.source.name}
            size="large"
          />
        )}
        <SpanBox
          css={{
            fontFamily: '$inter',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          {props.source.name}
        </SpanBox>
      </HStack>
      {/* <SpanBox
        css={{
          fontFamily: '$inter',
          fontSize: '13px',
          color: '$thTextSubtle4',
        }}
      >
        {subscription ? <>{subscription.description}</> : <></>}
      </SpanBox> */}
      <FeedbackView sendFeedback={sendHomeFeedback} />
    </VStack>
  )
}

type FeedbackViewProps = {
  sendFeedback: (type: SendHomeFeedbackType) => void
}

const FeedbackView = (props: FeedbackViewProps): JSX.Element => {
  return (
    <HStack css={{ ml: 'auto', mt: 'auto', gap: '5px' }}>
      <Button
        style="plainIcon"
        onClick={(event) => {
          props.sendFeedback('MORE')
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <ThumbsUp weight="fill" />
      </Button>
      <Button
        style="plainIcon"
        onClick={(event) => {
          props.sendFeedback('LESS')
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <ThumbsDown weight="fill" />
      </Button>
    </HStack>
  )
}
