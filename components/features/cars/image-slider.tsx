import { useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const IMAGE_HEIGHT = 320;

type Props = {
  images?: string[];
};

export function ImageSlider({ images = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [
    "https://img.freepik.com/free-psd/black-isolated-car_23-2151852894.jpg?semt=ais_hybrid&w=740&q=80",
  ];

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  return (
    <View>
      <FlatList
        data={displayImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: IMAGE_HEIGHT }}
            resizeMode="cover"
          />
        )}
      />

      <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
        {displayImages.map((_, i) => (
          <View
            key={i}
            className={`h-3 w-3 mx-1 ${
              i === activeIndex
                ? "bg-primary-500 rounded-full"
                : "bg-white/60 rounded-full border border-outline-100"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
