if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/ahmet/.gradle/caches/8.10.2/transforms/c7c01c5ba719d9104e6a8f76c2e0feba/transformed/hermes-android-0.76.3-debug/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/ahmet/.gradle/caches/8.10.2/transforms/c7c01c5ba719d9104e6a8f76c2e0feba/transformed/hermes-android-0.76.3-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

