cmake_minimum_required(VERSION 3.3)
set(CMAKE_TOOLCHAIN_FILE ${CMAKE_CURRENT_SOURCE_DIR}/submodule/vcpkg/scripts/buildsystems/vcpkg.cmake)
set(CMAKE_COLOR_MAKEFILE ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_INCLUDE_DIRECTORIES_PROJECT_BEFORE ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
project(HTMLMap)

set(CESIUM_TB_DIR "${CMAKE_CURRENT_SOURCE_DIR}/submodule/cesium-terrain-builder/")

# The version number
set(CTB_VERSION_MAJOR 0)
set(CTB_VERSION_MINOR 4)
set(CTB_VERSION_PATCH 1)

# Ensure we have a C++11 compatible compiler (see
# http://www.guyrutenberg.com/2014/01/05/enabling-c11-c0x-in-cmake/)
include(CheckCXXCompilerFlag)
CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X)

if(NOT MSVC)
  if(COMPILER_SUPPORTS_CXX11)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
  elseif(COMPILER_SUPPORTS_CXX0X)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x")
  else()
    message(FATAL_ERROR "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.")
  endif()
endif()

# We need g++ >= version 4.7 (see
# http://stackoverflow.com/questions/4058565/check-gcc-minor-in-cmake)
if (CMAKE_COMPILER_IS_GNUCXX)
  execute_process(COMMAND ${CMAKE_CXX_COMPILER} -dumpversion
    OUTPUT_VARIABLE GCXX_VERSION)
  if (GCXX_VERSION VERSION_LESS 4.7)
    message(FATAL_ERROR "The compiler ${CMAKE_CXX_COMPILER} is version ${GCXX_VERSION} which is not supported. Please use version 4.7 or greater.")
  endif()
endif()

# The tile size (width and height). According to the spec this should always be
# 65
set(TERRAIN_TILE_SIZE 65)
# The tile water mask size (width and height). According to the spec this
# should always be 256
set(TERRAIN_MASK_SIZE 256)

# Configure a header file to pass some of the CMake settings to the source code
configure_file(
  "${CESIUM_TB_DIR}/src/config.hpp.in"
  "${CESIUM_TB_DIR}/config.hpp"
  )

# Add the binary tree to the search path for include files so that we will find
# `config.hpp`
include_directories("${PROJECT_BINARY_DIR}")

# Ensure the configuration is installed
install(FILES ${PROJECT_BINARY_DIR}/config.hpp DESTINATION include/ctb)

# Perform as many checks as possible on debug builds:
#    cmake -DCMAKE_BUILD_TYPE=Debug ..
if(NOT MSVC)
  set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -Wall -Wextra --pedantic")
  #set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -Wall -Wextra --pedantic")
endif()

FIND_PACKAGE (Threads)

find_package(GDAL CONFIG REQUIRED)
include_directories("${CMAKE_CURRENT_SOURCE_DIR}/submodule/vcpkg/packages/gdal_x86-windows/include")
#add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/submodule/cesium-terrain-builder/")

include_directories(${GDAL_INCLUDE_DIRS})

# Build and install libctb
include_directories("${CESIUM_TB_DIR}/src")
add_subdirectory("${CESIUM_TB_DIR}/src")

# Build and install libcommander
include_directories("${CESIUM_TB_DIR}/deps")
add_subdirectory("${CESIUM_TB_DIR}/deps")

# Build and install the tools
add_subdirectory("${CESIUM_TB_DIR}/tools")