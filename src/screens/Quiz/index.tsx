import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, BackHandler } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { styles } from "./styles";
import { Audio } from "expo-av";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  useAnimatedScrollHandler,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";

import { THEME } from "../../styles/theme";
import { QUIZ } from "../../data/quiz";
import { historyAdd } from "../../storage/quizHistoryStorage";
import { Loading } from "../../components/Loading";
import { Question } from "../../components/Question";
import { QuizHeader } from "../../components/QuizHeader";
import { ConfirmButton } from "../../components/ConfirmButton";
import { OutlineButton } from "../../components/OutlineButton";
import { OverlayFeedback } from "../../components/OverlayFeedback";
import { ProgressBar } from "../../components/ProgressBar";

interface Params {
  id: string;
}

type QuizProps = (typeof QUIZ)[0];

const CARD_INCLINATION = 10;
const CARD_AREA_SKIP = -200;

export function Quiz() {
  const [points, setPoints] = useState(0);
  const [statusReply, setStatusReply] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quiz, setQuiz] = useState<QuizProps>({} as QuizProps);
  const [alternativeSelected, setAlternativeSelected] = useState<null | number>(
    null
  );

  const shakeShared = useSharedValue(0);
  const scrollYShared = useSharedValue(0);
  const cardPositionYShared = useSharedValue(0);

  const { navigate } = useNavigation();

  const route = useRoute();
  const { id } = route.params as Params;

  async function playSound(isCorrect: boolean) {
    const file = isCorrect
      ? require("../../assets/correct.mp3")
      : require("../../assets/wrong.mp3");
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true });

    await sound.setPositionAsync(0);
    await sound.playAsync();
  }

  function handleSkipConfirm() {
    Alert.alert("Pular", "Deseja realmente pular a questão?", [
      { text: "Sim", onPress: () => handleNextQuestion() },
      { text: "Não", onPress: () => {} },
    ]);
  }

  async function handleFinished() {
    await historyAdd({
      id: new Date().getTime().toString(),
      title: quiz.title,
      level: quiz.level,
      points,
      questions: quiz.questions.length,
    });

    navigate("finish", {
      points: String(points),
      total: String(quiz.questions.length),
    });
  }

  function handleNextQuestion() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prevState) => prevState + 1);
    } else {
      handleFinished();
    }
  }

  async function handleConfirm() {
    if (alternativeSelected === null) {
      return handleSkipConfirm();
    }

    if (quiz.questions[currentQuestion].correct === alternativeSelected) {
      await playSound(true);
      setStatusReply(1);
      setPoints((prevState) => prevState + 1);
      handleNextQuestion();
    } else {
      await playSound(false);
      setStatusReply(2);
      shakeAnimation();
    }

    setAlternativeSelected(null);
  }

  function handleStop() {
    Alert.alert("Parar", "Deseja parar agora?", [
      {
        text: "Não",
        style: "cancel",
      },
      {
        text: "Sim",
        style: "destructive",
        onPress: () => navigate("home"),
      },
    ]);

    return true;
  }

  // ativa o movimento de arrastar depois de 200ms
  const onPan = Gesture.Pan()
    .onUpdate((e) => {
      const moveToRight = e.translationX < 0;
      console.log(e.translationX);
      if (moveToRight) {
        cardPositionYShared.value = e.translationX;
      }
    })
    .activateAfterLongPress(200)
    .onEnd((e) => {
      if (e.translationX < CARD_AREA_SKIP) {
        runOnJS(handleSkipConfirm)();
      }
      cardPositionYShared.value = withTiming(0);
    });

  async function shakeAnimation() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeShared.value = withSequence(
      withTiming(3, { duration: 400, easing: Easing.bounce }),
      withTiming(0, undefined, (finished) => {
        "worklet";
        if (finished) {
          runOnJS(handleNextQuestion);
        }
      })
    );
  }

  const handlerScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollYShared.value = e.contentOffset.y;
    },
  });

  const dragStyles = useAnimatedStyle(() => {
    const rotateZ = cardPositionYShared.value / CARD_INCLINATION;
    return {
      transform: [
        { translateX: cardPositionYShared.value },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const shakeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shakeShared.value,
            [0, 0.5, 1, 1.5, 2, 2.5, 3],
            [0, -15, 0, 15, 0, -15, 0]
          ),
        },
      ],
    };
  });

  const fixedProgressBarStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      zIndex: 1,
      paddingTop: 50,
      backgroundColor: THEME.COLORS.GREY_500,
      width: "110%",
      left: "-5%",
      opacity: interpolate(
        scrollYShared.value,
        [50, 90],
        [0, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollYShared.value,
            [50, 100],
            [-40, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollYShared.value,
        [50, 90],
        [1, 0],
        Extrapolate.CLAMP
      ),
    };
  });

  useEffect(() => {
    const quizSelected = QUIZ.filter((item) => item.id === id)[0];
    setQuiz(quizSelected);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (quiz.questions) {
      handleNextQuestion();
    }
  }, [points]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleStop
    );

    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <OverlayFeedback status={statusReply} />
      <Animated.View style={fixedProgressBarStyle}>
        <Text style={styles.title}>{quiz.title}</Text>
        <ProgressBar
          total={quiz.questions.length}
          current={currentQuestion + 1}
        />
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.question}
        onScroll={handlerScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <QuizHeader
            title={quiz.title}
            currentQuestion={currentQuestion + 1}
            totalOfQuestions={quiz.questions.length}
          />
        </Animated.View>

        <GestureDetector gesture={onPan}>
          <Animated.View style={[shakeAnimatedStyle, dragStyles]}>
            <Question
              key={quiz.questions[currentQuestion].title}
              question={quiz.questions[currentQuestion]}
              alternativeSelected={alternativeSelected}
              setAlternativeSelected={setAlternativeSelected}
              onUnmount={() => setStatusReply(0)}
            />
          </Animated.View>
        </GestureDetector>

        <View style={styles.footer}>
          <OutlineButton title="Parar" onPress={handleStop} />
          <ConfirmButton onPress={handleConfirm} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
