'use client';
import {
  LiveKitRoom,
  PreJoin,
  LocalUserChoices,
  useToken,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
} from 'livekit-client';


  import { saveAs } from 'file-saver';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { use, useMemo, useState,useEffect } from 'react';
import { DebugMode } from '../../lib/Debug';
import {
  decodePassphrase,
  encodePassphrase,
  randomString,
  useServerUrl,
} from '../../lib/client-utils';
import dynamic from 'next/dynamic';
import * as tf from '@tensorflow/tfjs';
import { FaceDetection } from '@mediapipe/face_detection';



const PreJoinNoSSR = dynamic(
  async () => {
    return (await import('@livekit/components-react')).PreJoin;
  },
  { ssr: false },
);

const Home: NextPage = () => {
  const router = useRouter();
  const { name: roomName } = router.query;
  const e2eePassphrase =
    typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));

  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);

  function handlePreJoinSubmit(values: LocalUserChoices) {
    if (values.e2ee) {
      location.hash = encodePassphrase(values.sharedPassphrase);
    }
    setPreJoinChoices(values);
  }
  


  
  return (
    <>
      <Head>
        <title>LiveKit Meet</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main data-lk-theme="default">
        {roomName && !Array.isArray(roomName) && preJoinChoices ? (
          <ActiveRoom
            roomName={roomName}
            userChoices={preJoinChoices}
            onLeave={() => {
              router.push('/');
            }}
          ></ActiveRoom>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <PreJoinNoSSR
              onError={(err) => console.log('error while setting up prejoin', err)}
              defaults={{
                username: '',
                videoEnabled: true,
                audioEnabled: true,
                e2ee: !!e2eePassphrase,
                sharedPassphrase: e2eePassphrase || randomString(64),
              }}
              onSubmit={handlePreJoinSubmit}
              showE2EEOptions={true}
            ></PreJoinNoSSR>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;

type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  roomName: string;
  region?: string;
  onLeave?: () => void;
};
const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {
  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, {
    userInfo: {
      identity: userChoices.username,
      name: userChoices.username,
    },
  });

  const router = useRouter();
  const { region, hq } = router.query;

  const liveKitUrl = useServerUrl(region as string | undefined);

  const worker =
    typeof window !== 'undefined' &&
    userChoices.e2ee &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

  const e2eeEnabled = !!(userChoices.e2ee && worker);
  const keyProvider = new ExternalE2EEKeyProvider();

  const roomOptions = useMemo((): RoomOptions => {
    return {
      videoCaptureDefaults: {
        deviceId: userChoices.videoDeviceId ?? undefined,
        resolution: hq === 'true' ? VideoPresets.h2160 : VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers:
          hq === 'true'
            ? [VideoPresets.h1080, VideoPresets.h720]
            : [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
      },
      audioCaptureDefaults: {
        deviceId: userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, [userChoices, hq]);

  const room = useMemo(() => new Room(roomOptions), []);

  if (e2eeEnabled) {
    keyProvider.setKey(decodePassphrase(userChoices.sharedPassphrase));
    room.setE2EEEnabled(true);
  }
  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const [screenshot, setScreenshot] = useState<string | null>(null);

function takeScreenshot() {
  const videoTrack = Array.from(room.localParticipant.videoTracks.values())[0];
  console.log('videoTrack', videoTrack.track?.mediaStreamTrack)
  if (videoTrack && videoTrack.dimensions) {
    const tracks = videoTrack.track ? [videoTrack.track] : [];
    const mediaStream = new MediaStream(tracks);
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.play();
    document.body.appendChild(video);
  } else {
    alert('No video track available');
  }
}



  const captureFrames = async () => {
    const videos = document.querySelectorAll('video');
    // const data = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const stream = video.captureStream();
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);

      const blob = await imageCapture.takePhoto();
      const formData = new FormData();
      formData.append('image_file', blob);

      const response = await fetch('https://90b1-24-136-3-71.ngrok.io/detect_faces', {
        method: 'POST',
        body: formData
      });
      
      console.log('response', response)
      const result = await response.json();
      const numFaces = result.num_faces;
      
      if (numFaces > 0) {
        console.log('face detected')
      }
      else {
        console.log('no face detected')
        alert('no face detected')
      }
      
      // send the data to the server /save_number

      // const data = { number: numFaces.toString() };
      // const options = {
      //   method: 'POST',
      //   body: data
      // };
      // const response2 = await fetch('https://df79-24-136-3-71.ngrok.io/save_number', options);

       
    }

  };

  // Run downloadScreenshot every 2 seconds
  // setInterval(downloadScreenshot, 2000);

  const Home = () => {
    // ...
    // ...

  // setInterval(captureFrames , 2000);

  }

  return (
    <>
    <head><script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface"></script></head>
      {liveKitUrl && (
        <LiveKitRoom
          room={room}
          token={token}
          serverUrl={liveKitUrl}
          connectOptions={connectOptions}
          video={userChoices.videoEnabled}
          audio={userChoices.audioEnabled}
          onDisconnected={onLeave}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
          <DebugMode logLevel={LogLevel.info} />
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <button onClick={()=>setInterval(captureFrames,2000)}>captureFrames</button>
            {screenshot && <img src={screenshot} />}
          </div>
        </LiveKitRoom>
      )}
    </>
  );
};
